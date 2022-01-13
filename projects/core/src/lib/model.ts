import { AbstractControl, AsyncValidatorFn, ValidatorFn } from '@angular/forms';
import { ArrayItemOf, Omit, Is } from './common';

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
        ? ExtractFormValue1<TValue[P], TFormGroupChildren[P]>
        : FieldToRemove;
}>;

type FormArrayValueOf<TValue extends any[], TFormArrayChildren extends WFormArrayChildren> =
    ExtractFormValue1<ArrayItemOf<TValue>, ArrayItemOf<TFormArrayChildren>>[];

// Starting from Typescript 3.7 recursive type references are possible
// As we target Angular 7 (Typescript 3.2) we cannot use recursive type reference
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


type FormGroupValueOf1<TValue extends object, TFormGroupChildren extends WFormGroupChildren> = CleanRemovedFields<{
    [P in keyof TValue]: P extends keyof TFormGroupChildren
        ? ExtractFormValue2<TValue[P], TFormGroupChildren[P]>
        : FieldToRemove;
}>;

type FormArrayValueOf1<TValue extends any[], TFormArrayChildren extends WFormArrayChildren> =
    ExtractFormValue2<ArrayItemOf<TValue>, ArrayItemOf<TFormArrayChildren>>[];

export type ExtractFormValue1<TValue, TFormNode> =
    Is<{}, TValue> extends true
        ? GetFormValue<TFormNode>
        : (TFormNode extends WFormGroup<infer RGroupChildren>
            ? (TValue extends object ? FormGroupValueOf1<TValue, RGroupChildren> : never)
            : (TFormNode extends WFormArray<infer RArrayChildren>
                ? (TValue extends any[] ? FormArrayValueOf1<TValue, RArrayChildren> : never)
                : (TFormNode extends (WFormControl<infer R> | WFormNative<infer R>)
                    ? TValue | (any extends R ? never : R)
                    : (TFormNode extends (WFormPortal | WFormPlaceholder)
                        ? any
                        : never))));

type FormGroupValueOf2<TValue extends object, TFormGroupChildren extends WFormGroupChildren> = CleanRemovedFields<{
    [P in keyof TValue]: P extends keyof TFormGroupChildren
        ? ExtractFormValue3<TValue[P], TFormGroupChildren[P]>
        : FieldToRemove;
}>;

type FormArrayValueOf2<TValue extends any[], TFormArrayChildren extends WFormArrayChildren> =
    ExtractFormValue3<ArrayItemOf<TValue>, ArrayItemOf<TFormArrayChildren>>[];
                            
export type ExtractFormValue2<TValue, TFormNode> =
    Is<{}, TValue> extends true
        ? GetFormValue<TFormNode>
        : (TFormNode extends WFormGroup<infer RGroupChildren>
            ? (TValue extends object ? FormGroupValueOf2<TValue, RGroupChildren> : never)
            : (TFormNode extends WFormArray<infer RArrayChildren>
                ? (TValue extends any[] ? FormArrayValueOf2<TValue, RArrayChildren> : never)
                : (TFormNode extends (WFormControl<infer R> | WFormNative<infer R>)
                    ? TValue | (any extends R ? never : R)
                    : (TFormNode extends (WFormPortal | WFormPlaceholder)
                        ? any
                        : never))));

type FormGroupValueOf3<TValue extends object, TFormGroupChildren extends WFormGroupChildren> = CleanRemovedFields<{
    [P in keyof TValue]: P extends keyof TFormGroupChildren
        ? ExtractFormValue4<TValue[P], TFormGroupChildren[P]>
        : FieldToRemove;
}>;

type FormArrayValueOf3<TValue extends any[], TFormArrayChildren extends WFormArrayChildren> =
    ExtractFormValue4<ArrayItemOf<TValue>, ArrayItemOf<TFormArrayChildren>>[];
                            
export type ExtractFormValue3<TValue, TFormNode> =
    Is<{}, TValue> extends true
        ? GetFormValue<TFormNode>
        : (TFormNode extends WFormGroup<infer RGroupChildren>
            ? (TValue extends object ? FormGroupValueOf3<TValue, RGroupChildren> : never)
            : (TFormNode extends WFormArray<infer RArrayChildren>
                ? (TValue extends any[] ? FormArrayValueOf3<TValue, RArrayChildren> : never)
                : (TFormNode extends (WFormControl<infer R> | WFormNative<infer R>)
                    ? TValue | (any extends R ? never : R)
                    : (TFormNode extends (WFormPortal | WFormPlaceholder)
                        ? any
                        : never))));

type FormGroupValueOf4<TValue extends object, TFormGroupChildren extends WFormGroupChildren> = CleanRemovedFields<{
    [P in keyof TValue]: P extends keyof TFormGroupChildren
        ? ExtractFormValue5<TValue[P], TFormGroupChildren[P]>
        : FieldToRemove;
}>;

type FormArrayValueOf4<TValue extends any[], TFormArrayChildren extends WFormArrayChildren> =
    ExtractFormValue5<ArrayItemOf<TValue>, ArrayItemOf<TFormArrayChildren>>[];
                            
export type ExtractFormValue4<TValue, TFormNode> =
    Is<{}, TValue> extends true
        ? GetFormValue<TFormNode>
        : (TFormNode extends WFormGroup<infer RGroupChildren>
            ? (TValue extends object ? FormGroupValueOf4<TValue, RGroupChildren> : never)
            : (TFormNode extends WFormArray<infer RArrayChildren>
                ? (TValue extends any[] ? FormArrayValueOf4<TValue, RArrayChildren> : never)
                : (TFormNode extends (WFormControl<infer R> | WFormNative<infer R>)
                    ? TValue | (any extends R ? never : R)
                    : (TFormNode extends (WFormPortal | WFormPlaceholder)
                        ? any
                        : never))));

type FormGroupValueOf5<TValue extends object, TFormGroupChildren extends WFormGroupChildren> = CleanRemovedFields<{
    [P in keyof TValue]: P extends keyof TFormGroupChildren
        ? ExtractFormValue6<TValue[P], TFormGroupChildren[P]>
        : FieldToRemove;
}>;

type FormArrayValueOf5<TValue extends any[], TFormArrayChildren extends WFormArrayChildren> =
    ExtractFormValue6<ArrayItemOf<TValue>, ArrayItemOf<TFormArrayChildren>>[];
                            
export type ExtractFormValue5<TValue, TFormNode> =
    Is<{}, TValue> extends true
        ? GetFormValue<TFormNode>
        : (TFormNode extends WFormGroup<infer RGroupChildren>
            ? (TValue extends object ? FormGroupValueOf5<TValue, RGroupChildren> : never)
            : (TFormNode extends WFormArray<infer RArrayChildren>
                ? (TValue extends any[] ? FormArrayValueOf5<TValue, RArrayChildren> : never)
                : (TFormNode extends (WFormControl<infer R> | WFormNative<infer R>)
                    ? TValue | (any extends R ? never : R)
                    : (TFormNode extends (WFormPortal | WFormPlaceholder)
                        ? any
                        : never))));

export type ExtractFormValue6<TValue, TFormNode> = any;

export type GetFormValue<TFormNode> =
    TFormNode extends WFormGroup<infer RGroupChildren>
        ? { [P in keyof RGroupChildren]?: GetFormValue1<RGroupChildren[P]> }
        : (TFormNode extends WFormArray<infer RArrayChildren>
            ? GetFormValue1<ArrayItemOf<RArrayChildren>>[]
            : (TFormNode extends (WFormControl<infer R> | WFormNative<infer R>)
                ? R
                : (TFormNode extends (WFormPortal | WFormPlaceholder)
                    ? any
                    : never)));

export type GetFormValue1<TFormNode> =
    TFormNode extends WFormGroup<infer RGroupChildren>
        ? { [P in keyof RGroupChildren]?: GetFormValue2<RGroupChildren[P]> }
        : (TFormNode extends WFormArray<infer RArrayChildren>
            ? GetFormValue2<ArrayItemOf<RArrayChildren>>[]
            : (TFormNode extends (WFormControl<infer R> | WFormNative<infer R>)
                ? R
                : (TFormNode extends (WFormPortal | WFormPlaceholder)
                    ? any
                    : never)));

export type GetFormValue2<TFormNode> =
    TFormNode extends WFormGroup<infer RGroupChildren>
        ? { [P in keyof RGroupChildren]?: GetFormValue3<RGroupChildren[P]> }
        : (TFormNode extends WFormArray<infer RArrayChildren>
            ? GetFormValue3<ArrayItemOf<RArrayChildren>>[]
            : (TFormNode extends (WFormControl<infer R> | WFormNative<infer R>)
                ? R
                : (TFormNode extends (WFormPortal | WFormPlaceholder)
                    ? any
                    : never)));

export type GetFormValue3<TFormNode> =
    TFormNode extends WFormGroup<infer RGroupChildren>
        ? { [P in keyof RGroupChildren]?: GetFormValue4<RGroupChildren[P]> }
        : (TFormNode extends WFormArray<infer RArrayChildren>
            ? GetFormValue4<ArrayItemOf<RArrayChildren>>[]
            : (TFormNode extends (WFormControl<infer R> | WFormNative<infer R>)
                ? R
                : (TFormNode extends (WFormPortal | WFormPlaceholder)
                    ? any
                    : never)));

export type GetFormValue4<TFormNode> =
    TFormNode extends WFormGroup<infer RGroupChildren>
        ? { [P in keyof RGroupChildren]?: GetFormValue5<RGroupChildren[P]> }
        : (TFormNode extends WFormArray<infer RArrayChildren>
            ? GetFormValue5<ArrayItemOf<RArrayChildren>>[]
            : (TFormNode extends (WFormControl<infer R> | WFormNative<infer R>)
                ? R
                : (TFormNode extends (WFormPortal | WFormPlaceholder)
                    ? any
                    : never)));

export type GetFormValue5<TFormNode> =
    TFormNode extends WFormGroup<infer RGroupChildren>
        ? { [P in keyof RGroupChildren]?: GetFormValue6<RGroupChildren[P]> }
        : (TFormNode extends WFormArray<infer RArrayChildren>
            ? GetFormValue6<ArrayItemOf<RArrayChildren>>[]
            : (TFormNode extends (WFormControl<infer R> | WFormNative<infer R>)
                ? R
                : (TFormNode extends (WFormPortal | WFormPlaceholder)
                    ? any
                    : never)));

export type GetFormValue6<TFormNode> = any;