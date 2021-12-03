import { VFormNode, VFormNodeType, VFormPlaceholder } from '../model';
import { Maybe, TransformFn } from '../common';
import { mapValues, pickBy } from '../utils';

export enum VFormTreeNodeType {
    Control, Group, Array, Native, Portal, Placeholder, Options
}

export interface VFormTreeVisitor {
    begin(): void;
    end(): void;

    resolveType(node: any): VFormTreeNodeType;
    
    beginOptions(node: any): void;
    optionsChild(node: any): any;
    endOptions(node: any): void;

    beginGroup(node: any): void;
    groupChildren(node: any): Record<string, any>;
    endGroup(node: any, nodes: Record<string, VFormNode>): VFormNode;

    beginArray(node: any): void;
    arrayChildren(node: any): any[];
    endArray(node: any, nodes: VFormNode[]): VFormNode;

    control(node: any): VFormNode;

    native(node: any): VFormNode;

    portal(node: any): VFormNode;
}

export function buildTreeTranslator(env: VFormTreeVisitor): TransformFn<any, VFormNode> {
    return rootNode => {
        env.begin();
        const node = translateNode(rootNode) as VFormNode;
        env.end();

        if (!node) {
            throw new Error('Environment tree cannot be rendered into empty tree');
        }

        return node;
    };

    function translateNode(node: any): Maybe<VFormNode | VFormPlaceholder> {
        const type = env.resolveType(node);
        switch (type) {
            case VFormTreeNodeType.Options:
                env.beginOptions(node);
                const nextNode = translateNode(env.optionsChild(node));
                env.endOptions(node);
                return nextNode;
            case VFormTreeNodeType.Array:
                env.beginArray(node);
                return env.endArray(node, env.arrayChildren(node)
                    .map(translateNode)
                    .filter(Boolean) as VFormNode[]);
            case VFormTreeNodeType.Group:
                env.beginGroup(node);
                const children = pickBy(
                    mapValues(
                        env.groupChildren(node),
                        translateNode),
                    Boolean) as { [name: string]: VFormNode };
                return env.endGroup(node, children);
            case VFormTreeNodeType.Control:
                return env.control(node);
            case VFormTreeNodeType.Native:
                return env.native(node);
            case VFormTreeNodeType.Placeholder:
                return { type: VFormNodeType.Placeholder };
            case VFormTreeNodeType.Portal:
                return env.portal(node);
            default:
                throw new Error(`Unknown translate form node type: ${type}`);
        }
    }
}
