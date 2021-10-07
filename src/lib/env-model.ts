import { VFormArray, VFormControl, VFormGroup, VFormNode } from './model';

export enum VEnvFormNodeType { Options, Group, Array, Control, None }

export interface VFormEnvironment<TNode> {
    fork(node: TNode): VFormEnvironment<TNode>;
    resolveType(node: TNode): VEnvFormNodeType;
    resolveGroupChildren(node: TNode): Record<string, TNode>;
    resolveArrayChildren(node: TNode): TNode[];
    resolveControl(control: TNode): VFormControl;
    resolveGroup(group: TNode, children: Record<string, VFormNode>): VFormGroup;
    resolveArray(array: TNode, children: VFormNode[]): VFormArray;
}

export interface VEnvFormNodeFactory<T, TNode> {
    (value: T): TNode;
}
