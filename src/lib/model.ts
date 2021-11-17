import { AbstractControl, AsyncValidatorFn, ValidatorFn } from '@angular/forms';

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
    Control, Group, Array
}

export enum VFormHooks {
    Change = 'change',
    Blur = 'blur',
    Submit = 'submit',
}

export interface VFormNodeBase {
    key?: any;
    type: VFormNodeType;
    disabled: boolean;
    validator?: VValidatorNode;
    asyncValidator?: VAsyncValidatorNode;
    updateOn?: VFormHooks;
    data: Record<string, any>;
}

export interface VFormControl extends VFormNodeBase {
    type: VFormNodeType.Control;
    dirty?: boolean;
    touched?: boolean;
    value: any;
}

export interface VFormGroup extends VFormNodeBase {
    type: VFormNodeType.Group;
    children: Record<string, VFormNode>;
}

export interface VFormArray extends VFormNodeBase {
    type: VFormNodeType.Array;
    children: VFormNode[];
}

export type VFormNode = VFormControl | VFormGroup | VFormArray;

export interface VFormNodeFactory<T> {
    (value: T): VFormNode;
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

