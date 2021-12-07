import { WFormNode, WFormNodeType, WFormPlaceholder } from '../model';
import { Maybe, TransformFn } from '../common';
import { mapValues, pickBy } from '../utils';

export enum WFormTreeNodeType {
    Control, Group, Array, Native, Portal, Placeholder, Options
}

export interface WFormTreeVisitor {
    begin(): void;
    end(): void;

    resolveType(node: any): WFormTreeNodeType;
    
    beginOptions(node: any): void;
    optionsChild(node: any): any;
    endOptions(node: any): void;

    beginGroup(node: any): void;
    groupChildren(node: any): Record<string, any>;
    endGroup(node: any, nodes: Record<string, WFormNode>): WFormNode;

    beginArray(node: any): void;
    arrayChildren(node: any): any[];
    endArray(node: any, nodes: WFormNode[]): WFormNode;

    control(node: any): WFormNode;

    native(node: any): WFormNode;

    portal(node: any): WFormNode;
}

export function buildTreeTranslator(env: WFormTreeVisitor): TransformFn<any, WFormNode> {
    return rootNode => {
        env.begin();
        const node = translateNode(rootNode) as WFormNode;
        env.end();

        if (!node) {
            throw new Error('Environment tree cannot be rendered into empty tree');
        }

        return node;
    };

    function translateNode(node: any): Maybe<WFormNode | WFormPlaceholder> {
        const type = env.resolveType(node);
        switch (type) {
            case WFormTreeNodeType.Options:
                env.beginOptions(node);
                const nextNode = translateNode(env.optionsChild(node));
                env.endOptions(node);
                return nextNode;
            case WFormTreeNodeType.Array:
                env.beginArray(node);
                return env.endArray(node, env.arrayChildren(node)
                    .map(translateNode)
                    .filter(Boolean) as WFormNode[]);
            case WFormTreeNodeType.Group:
                env.beginGroup(node);
                const children = pickBy(
                    mapValues(
                        env.groupChildren(node),
                        translateNode),
                    Boolean) as { [name: string]: WFormNode };
                return env.endGroup(node, children);
            case WFormTreeNodeType.Control:
                return env.control(node);
            case WFormTreeNodeType.Native:
                return env.native(node);
            case WFormTreeNodeType.Placeholder:
                return { type: WFormNodeType.Placeholder };
            case WFormTreeNodeType.Portal:
                return env.portal(node);
            default:
                throw new Error(`Unknown translate form node type: ${type}`);
        }
    }
}
