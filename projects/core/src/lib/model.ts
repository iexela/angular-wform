import { AbstractControl, AsyncValidatorFn, ValidatorFn } from '@angular/forms';
import { ArrayItemOf, Is } from './common';

export type WPathElement = string | number;

// Validators

export enum WValidatorNodeType {
    Compound, Simple, Factory
}

export enum WValidationStrategy {
    Append,
    Replace,
}

export interface WValidatorFactory {
    (...args: any[]): ValidatorFn;
}

export interface WValidatorMixer<T> {
    (validators: ValidatorFn[]): ValidatorFn | ValidatorFn[];
}

export interface WCompoundValidatorNode {
    type: WValidatorNodeType.Compound;
    mixer: WValidatorMixer<any>;
    children: WValidatorNode[];
}

export interface WSimpleValidatorNode {
    type: WValidatorNodeType.Simple;
    validator: ValidatorFn;
    locals?: any[];
}

export interface WFactoryValidatorNode {
    type: WValidatorNodeType.Factory;
    factory: WValidatorFactory;
    args: any[];
}

export type WValidatorNode = WCompoundValidatorNode | WSimpleValidatorNode | WFactoryValidatorNode;

// Async validators

export enum WAsyncValidatorNodeType {
    Compound, Simple, Factory
}

export interface WAsyncValidatorFactory {
    (...args: any[]): AsyncValidatorFn;
}

export interface WAsyncValidatorMixer<T> {
    (validators: AsyncValidatorFn[]): AsyncValidatorFn | AsyncValidatorFn[];
}

export interface WAsyncCompoundValidatorNode {
    type: WAsyncValidatorNodeType.Compound;
    mixer: WAsyncValidatorMixer<any>;
    children: WAsyncValidatorNode[];
}

export interface WAsyncSimpleValidatorNode {
    type: WAsyncValidatorNodeType.Simple;
    validator: AsyncValidatorFn;
    locals?: any[];
}

export interface WAsyncFactoryValidatorNode {
    type: WAsyncValidatorNodeType.Factory;
    factory: WAsyncValidatorFactory;
    args: any[];
}

export type WAsyncValidatorNode = WAsyncCompoundValidatorNode | WAsyncSimpleValidatorNode | WAsyncFactoryValidatorNode;

// Form nodes

export enum WFormNodeType {
    Control, Group, Array, Native, Portal, Placeholder
}

export enum WFormHooks {
    Change = 'change',
    Blur = 'blur',
    Submit = 'submit',
}

export interface WFormNodeBase {
    key?: any;
    type: WFormNodeType;
    data: Record<string, any>;
    disabled: boolean;
    validator?: WValidatorNode;
    asyncValidator?: WAsyncValidatorNode;
    validationStrategy?: WValidationStrategy;
    dirty?: boolean;
    touched?: boolean;
}

export interface WFormNodeCreatedBase extends WFormNodeBase {
    updateOn?: WFormHooks;
}

export interface WFormControl<T> extends WFormNodeCreatedBase {
    type: WFormNodeType.Control;
    value?: T;
}

export type WFormGroupChildren = { [name: string]: WFormNode | WFormPlaceholder };

export interface WFormGroup<C extends WFormGroupChildren = WFormGroupChildren> extends WFormNodeCreatedBase {
    type: WFormNodeType.Group;
    children: C;
}

export type WFormArrayChildren = (WFormNode | WFormPlaceholder)[];

export interface WFormArray<C extends WFormArrayChildren = WFormArrayChildren> extends WFormNodeCreatedBase {
    type: WFormNodeType.Array;
    children: C;
}

export interface WFormNative<T> extends WFormNodeBase {
    type: WFormNodeType.Native;
    control?: AbstractControl;
    value?: T;
}

export interface WFormPortal {
    type: WFormNodeType.Portal;
    name: string;
}

export interface WFormPlaceholder {
    type: WFormNodeType.Placeholder;
}

export type WThisFormNode = WFormGroup<any> | WFormArray<any> | WFormControl<any> | WFormNative<any>;
export type WFormNode = WThisFormNode | WFormPortal;

export interface WFormNodeFactory<TValue, TFormNode extends WFormNode> {
    (value: TValue): TFormNode;
}

export interface WFormNodePatcher {
    (control: AbstractControl): WFormNode;
}

export function isValidatorNode(value: any): value is WValidatorNode {
    return !!WValidatorNodeType[value['type']];
}

export function isAsyncValidatorNode(value: any): value is WAsyncValidatorNode {
    return !!WAsyncValidatorNodeType[value['type']];
}

const FIELD_TO_REMOVE = Symbol('field-to-remove');
type FieldToRemove = typeof FIELD_TO_REMOVE;

type CleanRemovedFields<T> = Omit<T, { [P in keyof T]: FieldToRemove extends T[P] ? P : never }[keyof T]>;

type FormGroupValueOf<TValue extends object, TFormGroupChildren extends WFormGroupChildren> = CleanRemovedFields<{
    [P in keyof TValue]: P extends keyof TFormGroupChildren
        ? ExtractFormValue<TValue[P], TFormGroupChildren[P]>
        : FieldToRemove;
}>;

type FormArrayValueOf<TValue extends any[], TFormArrayChildren extends WFormArrayChildren> =
    ExtractFormValue<ArrayItemOf<TValue>, ArrayItemOf<TFormArrayChildren>>[];

export type ExtractFormValue<TValue, TFormNode> =
    Is<{}, TValue> extends true
        ? GetFormValue<TFormNode>
        : (TFormNode extends WFormGroup<infer RGroupChildren>
            ? (TValue extends object ? FormGroupValueOf<TValue, RGroupChildren> : never)
            : (TFormNode extends WFormArray<infer RArrayChildren>
                ? (TValue extends any[] ? FormArrayValueOf<TValue, RArrayChildren> : never)
                : (TFormNode extends (WFormControl<infer R> | WFormNative<infer R>)
                    ? TValue | (any extends R ? never : R)
                    : (TFormNode extends (WFormPortal | WFormPlaceholder)
                        ? any
                        : never))));

export type GetFormValue<TFormNode> =
    TFormNode extends WFormGroup<infer RGroupChildren>
        ? { [P in keyof RGroupChildren]?: GetFormValue<RGroupChildren[P]> }
        : (TFormNode extends WFormArray<infer RArrayChildren>
            ? GetFormValue<ArrayItemOf<RArrayChildren>>[]
            : (TFormNode extends (WFormControl<infer R> | WFormNative<infer R>)
                ? R
                : (TFormNode extends (WFormPortal | WFormPlaceholder)
                    ? any
                    : never)));