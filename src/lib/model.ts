import { AbstractControl, AsyncValidatorFn, ValidatorFn } from '@angular/forms';

export type VPathElement = string | number;

// Validators

export enum VValidatorNodeType {
    Compound, Simple, Factory
}

export interface VValidatorFactory {
    (...args: any[]): ValidatorFn;
}

export interface VValidatorMixer<T> {
    (validators: ValidatorFn[]): ValidatorFn | ValidatorFn[];
}

export interface VCompoundValidatorNode {
    type: VValidatorNodeType.Compound;
    mixer: VValidatorMixer<any>;
    children: VValidatorNode[];
}

export interface VSimpleValidatorNode {
    type: VValidatorNodeType.Simple;
    validator: ValidatorFn;
    locals?: any[];
}

export interface VFactoryValidatorNode {
    type: VValidatorNodeType.Factory;
    factory: VValidatorFactory;
    args: any[];
}

export type VValidatorNode = VCompoundValidatorNode | VSimpleValidatorNode | VFactoryValidatorNode;

// Async validators

export enum VAsyncValidatorNodeType {
    Compound, Simple, Factory
}

export interface VAsyncValidatorFactory {
    (...args: any[]): AsyncValidatorFn;
}

export interface VAsyncValidatorMixer<T> {
    (validators: AsyncValidatorFn[]): AsyncValidatorFn | AsyncValidatorFn[];
}

export interface VAsyncCompoundValidatorNode {
    type: VAsyncValidatorNodeType.Compound;
    mixer: VAsyncValidatorMixer<any>;
    children: VAsyncValidatorNode[];
}

export interface VAsyncSimpleValidatorNode {
    type: VAsyncValidatorNodeType.Simple;
    validator: AsyncValidatorFn;
    locals?: any[];
}

export interface VAsyncFactoryValidatorNode {
    type: VAsyncValidatorNodeType.Factory;
    factory: VAsyncValidatorFactory;
    args: any[];
}

export type VAsyncValidatorNode = VAsyncCompoundValidatorNode | VAsyncSimpleValidatorNode | VAsyncFactoryValidatorNode;

// Form nodes

export enum VFormNodeType {
    Control, Group, Array, Native, Portal, Placeholder
}

export enum VFormHooks {
    Change = 'change',
    Blur = 'blur',
    Submit = 'submit',
}

export interface VFormNodeBase {
    key?: any;
    type: VFormNodeType;
    data: Record<string, any>;
    disabled: boolean;
    validator?: VValidatorNode;
    asyncValidator?: VAsyncValidatorNode;
    dirty?: boolean;
    touched?: boolean;
}

export interface VFormNodeCreatedBase extends VFormNodeBase {
    updateOn?: VFormHooks;
}

export interface VFormControl<T> extends VFormNodeCreatedBase {
    type: VFormNodeType.Control;
    value?: T;
}

export type VFormGroupChildren = { [name: string]: VFormNode | VFormPlaceholder };

export interface VFormGroup<C extends VFormGroupChildren = VFormGroupChildren> extends VFormNodeCreatedBase {
    type: VFormNodeType.Group;
    children: C;
}

export type VFormArrayChildren = (VFormNode | VFormPlaceholder)[];

export interface VFormArray<C extends VFormArrayChildren = VFormArrayChildren> extends VFormNodeCreatedBase {
    type: VFormNodeType.Array;
    children: C;
}

export interface VFormNative<T> extends VFormNodeBase {
    type: VFormNodeType.Native;
    control?: AbstractControl;
    value?: T;
}

export interface VFormPortal {
    type: VFormNodeType.Portal;
    name: string;
}

export interface VFormPlaceholder {
    type: VFormNodeType.Placeholder;
}

export type VThisFormNode = VFormGroup<any> | VFormArray<any> | VFormControl<any> | VFormNative<any>;
export type VFormNode = VThisFormNode | VFormPortal;

export interface VFormNodeFactory<T> {
    (value: T): VFormNode;
}

export interface VFormTranslator<TNode> {
    (node: TNode): VFormNode;
}

export interface VTranslatedFormNodeFactory<TValue, TNode> {
    (value: TValue): TNode;
}

export interface VFormPatcher {
    (control: AbstractControl): VFormNode;
}

export function isValidatorNode(value: any): value is VValidatorNode {
    return !!VValidatorNodeType[value['type']];
}

export function isAsyncValidatorNode(value: any): value is VAsyncValidatorNode {
    return !!VAsyncValidatorNodeType[value['type']];
}

