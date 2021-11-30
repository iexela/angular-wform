import { VFormArray, VFormControl, VFormGroup, VFormNode, VFormNodeType, VFormPlaceholder, VFormTranslator } from '..';
import { Maybe } from '../common';
import { mapValues, pickBy } from '../utils';
import { VEnvFormNode, VEnvFormOptions, VEnvFormPortal } from './example/model';

export enum VStagedFormNodeType {
    Control, Group, Array, Native, Portal, Placeholder, Options
}
export interface VFormStagedEnvironment {
    begin(): void;
    end(): void;

    resolveType(node: any): VStagedFormNodeType;
    
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

export function buildStagedTranslator(env: VFormStagedEnvironment): VFormTranslator<VEnvFormNode | VEnvFormPortal | VEnvFormOptions> {
    return rootNode => {
        env.begin();
        const node = mapStagedNode(rootNode) as VFormNode;
        env.end();

        if (!node) {
            throw new Error('Environment tree cannot be rendered into empty tree');
        }

        return node;
    };

    function mapStagedNode(node: any): Maybe<VFormNode | VFormPlaceholder> {
        const type = env.resolveType(node);
        switch (type) {
            case VStagedFormNodeType.Options:
                env.beginOptions(node);
                const nextNode = mapStagedNode(env.optionsChild(node));
                env.endOptions(node);
                return nextNode;
            case VStagedFormNodeType.Array:
                env.beginArray(node);
                return env.endArray(node, env.arrayChildren(node)
                    .map(mapStagedNode)
                    .filter(Boolean) as VFormNode[]);
            case VStagedFormNodeType.Group:
                env.beginGroup(node);
                const children = pickBy(
                    mapValues(
                        env.groupChildren(node),
                        mapStagedNode),
                    Boolean) as { [name: string]: VFormNode };
                return env.endGroup(node, children);
            case VStagedFormNodeType.Control:
                return env.control(node);
            case VStagedFormNodeType.Native:
                return env.native(node);
            case VStagedFormNodeType.Placeholder:
                return { type: VFormNodeType.Placeholder };
            case VStagedFormNodeType.Portal:
                return env.portal(node);
            default:
                throw new Error();
        }
    }
}
