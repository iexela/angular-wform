import { AbstractControl, ValidatorFn } from '@angular/forms';

export enum VValidatorNodeType {
    Compound, Simple, Factory
}

export interface VValidatorFactory {
    (...args: any[]): ValidatorFn;
};

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
