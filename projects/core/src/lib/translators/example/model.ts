import { AbstractControl } from '@angular/forms';
import { ArrayItemOf, Omit, PredicateFn } from '../../common';
import { WAsyncValidatorNode, WFormHooks, WValidatorNode } from '../../model';

export enum FormSampleNodeType {
    Control, Group, Array, Native, Portal, Placeholder, Options
}

export enum FormSampleMode {
    Create, Edit, View
}

export enum Location {
    AMER, EMEA, APAC
}

export interface SampleEnvironment {
    mode: FormSampleMode;
    location: Location;
    language: string;
    permissions: string[];
    role: string;
}

export type SampleEnvironmentPredicate = PredicateFn<SampleEnvironment>;

export interface FormSampleNodeBase {
    key?: any;
    type: FormSampleNodeType;
    visible: SampleEnvironmentPredicate;
    enabled: SampleEnvironmentPredicate;
    validator?: WValidatorNode;
    asyncValidator?: WAsyncValidatorNode;
    dirty?: boolean;
    touched?: boolean;
}

export interface FormSampleNodeCreatedBase extends FormSampleNodeBase {
    updateOn?: WFormHooks;
}

export interface FormSampleControl<T> extends FormSampleNodeCreatedBase {
    type: FormSampleNodeType.Control;
    required: SampleEnvironmentPredicate;
    value?: T;
}

export type FormSampleGroupChildren = { [name: string]: FormSampleNode | FormSamplePlaceholder };

export interface FormSampleGroup<C extends FormSampleGroupChildren = FormSampleGroupChildren> extends FormSampleNodeCreatedBase {
    type: FormSampleNodeType.Group;
    children: C;
}

export type FormSampleArrayChildren = (FormSampleNode | FormSamplePlaceholder)[];
export interface FormSampleArray<C extends FormSampleArrayChildren = FormSampleArrayChildren> extends FormSampleNodeCreatedBase {
    type: FormSampleNodeType.Array;
    children: C;
}

export interface FormSampleNative<T> extends FormSampleNodeBase {
    type: FormSampleNodeType.Native;
    control?: AbstractControl;
    value?: T;
}

export interface FormSamplePortal {
    type: FormSampleNodeType.Portal;
    name: string;
}

export interface FormSamplePlaceholder {
    type: FormSampleNodeType.Placeholder;
}

export interface FormSampleOptions<C extends FormSampleNoOptionsNoOptions = FormSampleNoOptionsNoOptions> {
    type: FormSampleNodeType.Options;
    mode: FormSampleMode;
    child: C;
}

export type ThisFormSampleNode = FormSampleControl<any> | FormSampleGroup<any> | FormSampleArray<any> | FormSampleNative<any>;
export type FormSampleNode = ThisFormSampleNode | FormSamplePortal | FormSampleOptions<any>;
export type FormSampleNoOptionsNoOptions = Exclude<FormSampleNode, FormSampleOptions<any>>;

export interface FormSampleNodeFactory<TValue, TNode extends FormSampleNode> {
    (value: TValue): TNode;
}

const FIELD_TO_REMOVE = Symbol('field-to-remove');
type FieldToRemove = typeof FIELD_TO_REMOVE;

type CleanRemovedFields<T> = Omit<T, { [P in keyof T]: FieldToRemove extends T[P] ? P : never }[keyof T]>;

type FormSampleGroupValueOf<TValue extends object, TFormGroupChildren extends FormSampleGroupChildren> = CleanRemovedFields<{
    [P in keyof TValue]: P extends keyof TFormGroupChildren
        ? ExtractFormSampleValue1<TValue[P], TFormGroupChildren[P]>
        : FieldToRemove;
}>;

type FormArrayValueOf<TValue extends any[], TFormArrayChildren extends FormSampleArrayChildren> =
    ExtractFormSampleValue1<ArrayItemOf<TValue>, ArrayItemOf<TFormArrayChildren>>[];

// Starting from Typescript 3.7 recursive type references are possible
// As we target Angular 7 (Typescript 3.2) we cannot use recursive type reference
export type ExtractFormSampleValue<TValue, TNode> =
    TNode extends FormSampleOptions<infer ROptionsChild>
        ? ExtractFormSampleValue1<TValue, ROptionsChild>
        : (TNode extends FormSampleGroup<infer RGroupChildren>
            ? (TValue extends object ? FormSampleGroupValueOf<TValue, RGroupChildren> : never)
            : (TNode extends FormSampleArray<infer RArrayChildren>
                ? (TValue extends any[] ? FormArrayValueOf<TValue, RArrayChildren> : never)
                : (TNode extends (FormSampleControl<any> | FormSampleNative<any> | FormSamplePortal | FormSamplePlaceholder)
                    ? TValue
                    : never)));

type FormSampleGroupValueOf1<TValue extends object, TFormGroupChildren extends FormSampleGroupChildren> = CleanRemovedFields<{
    [P in keyof TValue]: P extends keyof TFormGroupChildren
        ? ExtractFormSampleValue2<TValue[P], TFormGroupChildren[P]>
        : FieldToRemove;
}>;

type FormArrayValueOf1<TValue extends any[], TFormArrayChildren extends FormSampleArrayChildren> =
    ExtractFormSampleValue2<ArrayItemOf<TValue>, ArrayItemOf<TFormArrayChildren>>[];

export type ExtractFormSampleValue1<TValue, TNode> =
    TNode extends FormSampleOptions<infer ROptionsChild>
        ? ExtractFormSampleValue2<TValue, ROptionsChild>
        : (TNode extends FormSampleGroup<infer RGroupChildren>
            ? (TValue extends object ? FormSampleGroupValueOf1<TValue, RGroupChildren> : never)
            : (TNode extends FormSampleArray<infer RArrayChildren>
                ? (TValue extends any[] ? FormArrayValueOf1<TValue, RArrayChildren> : never)
                : (TNode extends (FormSampleControl<any> | FormSampleNative<any> | FormSamplePortal | FormSamplePlaceholder)
                    ? TValue
                    : never)));

type FormSampleGroupValueOf2<TValue extends object, TFormGroupChildren extends FormSampleGroupChildren> = CleanRemovedFields<{
    [P in keyof TValue]: P extends keyof TFormGroupChildren
        ? ExtractFormSampleValue3<TValue[P], TFormGroupChildren[P]>
        : FieldToRemove;
}>;

type FormArrayValueOf2<TValue extends any[], TFormArrayChildren extends FormSampleArrayChildren> =
    ExtractFormSampleValue3<ArrayItemOf<TValue>, ArrayItemOf<TFormArrayChildren>>[];

export type ExtractFormSampleValue2<TValue, TNode> =
    TNode extends FormSampleOptions<infer ROptionsChild>
        ? ExtractFormSampleValue3<TValue, ROptionsChild>
        : (TNode extends FormSampleGroup<infer RGroupChildren>
            ? (TValue extends object ? FormSampleGroupValueOf2<TValue, RGroupChildren> : never)
            : (TNode extends FormSampleArray<infer RArrayChildren>
                ? (TValue extends any[] ? FormArrayValueOf2<TValue, RArrayChildren> : never)
                : (TNode extends (FormSampleControl<any> | FormSampleNative<any> | FormSamplePortal | FormSamplePlaceholder)
                    ? TValue
                    : never)));

type FormSampleGroupValueOf3<TValue extends object, TFormGroupChildren extends FormSampleGroupChildren> = CleanRemovedFields<{
    [P in keyof TValue]: P extends keyof TFormGroupChildren
        ? ExtractFormSampleValue4<TValue[P], TFormGroupChildren[P]>
        : FieldToRemove;
}>;

type FormArrayValueOf3<TValue extends any[], TFormArrayChildren extends FormSampleArrayChildren> =
    ExtractFormSampleValue4<ArrayItemOf<TValue>, ArrayItemOf<TFormArrayChildren>>[];

export type ExtractFormSampleValue3<TValue, TNode> =
    TNode extends FormSampleOptions<infer ROptionsChild>
        ? ExtractFormSampleValue4<TValue, ROptionsChild>
        : (TNode extends FormSampleGroup<infer RGroupChildren>
            ? (TValue extends object ? FormSampleGroupValueOf3<TValue, RGroupChildren> : never)
            : (TNode extends FormSampleArray<infer RArrayChildren>
                ? (TValue extends any[] ? FormArrayValueOf3<TValue, RArrayChildren> : never)
                : (TNode extends (FormSampleControl<any> | FormSampleNative<any> | FormSamplePortal | FormSamplePlaceholder)
                    ? TValue
                    : never)));

type FormSampleGroupValueOf4<TValue extends object, TFormGroupChildren extends FormSampleGroupChildren> = CleanRemovedFields<{
    [P in keyof TValue]: P extends keyof TFormGroupChildren
        ? ExtractFormSampleValue5<TValue[P], TFormGroupChildren[P]>
        : FieldToRemove;
}>;

type FormArrayValueOf4<TValue extends any[], TFormArrayChildren extends FormSampleArrayChildren> =
    ExtractFormSampleValue5<ArrayItemOf<TValue>, ArrayItemOf<TFormArrayChildren>>[];

export type ExtractFormSampleValue4<TValue, TNode> =
    TNode extends FormSampleOptions<infer ROptionsChild>
        ? ExtractFormSampleValue5<TValue, ROptionsChild>
        : (TNode extends FormSampleGroup<infer RGroupChildren>
            ? (TValue extends object ? FormSampleGroupValueOf4<TValue, RGroupChildren> : never)
            : (TNode extends FormSampleArray<infer RArrayChildren>
                ? (TValue extends any[] ? FormArrayValueOf4<TValue, RArrayChildren> : never)
                : (TNode extends (FormSampleControl<any> | FormSampleNative<any> | FormSamplePortal | FormSamplePlaceholder)
                    ? TValue
                    : never)));

type FormSampleGroupValueOf5<TValue extends object, TFormGroupChildren extends FormSampleGroupChildren> = CleanRemovedFields<{
    [P in keyof TValue]: P extends keyof TFormGroupChildren
        ? ExtractFormSampleValue6<TValue[P], TFormGroupChildren[P]>
        : FieldToRemove;
}>;

type FormArrayValueOf5<TValue extends any[], TFormArrayChildren extends FormSampleArrayChildren> =
    ExtractFormSampleValue6<ArrayItemOf<TValue>, ArrayItemOf<TFormArrayChildren>>[];

export type ExtractFormSampleValue5<TValue, TNode> =
    TNode extends FormSampleOptions<infer ROptionsChild>
        ? ExtractFormSampleValue6<TValue, ROptionsChild>
        : (TNode extends FormSampleGroup<infer RGroupChildren>
            ? (TValue extends object ? FormSampleGroupValueOf5<TValue, RGroupChildren> : never)
            : (TNode extends FormSampleArray<infer RArrayChildren>
                ? (TValue extends any[] ? FormArrayValueOf5<TValue, RArrayChildren> : never)
                : (TNode extends (FormSampleControl<any> | FormSampleNative<any> | FormSamplePortal | FormSamplePlaceholder)
                    ? TValue
                    : never)));

export type ExtractFormSampleValue6<TValue, TNode> = any;

export type GetFormSampleValue<TNode> =
    TNode extends FormSampleGroup<infer RGroupChildren>
        ? { [P in keyof RGroupChildren]?: GetFormSampleValue1<RGroupChildren[P]> }
        : (TNode extends FormSampleArray<infer RArrayChildren>
            ? GetFormSampleValue1<ArrayItemOf<RArrayChildren>>[]
            : (TNode extends (FormSampleControl<infer R> | FormSampleNative<infer R>)
                ? R
                : (TNode extends (FormSamplePortal | FormSamplePlaceholder)
                    ? any
                    : never)));

export type GetFormSampleValue1<TNode> =
    TNode extends FormSampleGroup<infer RGroupChildren>
        ? { [P in keyof RGroupChildren]?: GetFormSampleValue2<RGroupChildren[P]> }
        : (TNode extends FormSampleArray<infer RArrayChildren>
            ? GetFormSampleValue2<ArrayItemOf<RArrayChildren>>[]
            : (TNode extends (FormSampleControl<infer R> | FormSampleNative<infer R>)
                ? R
                : (TNode extends (FormSamplePortal | FormSamplePlaceholder)
                    ? any
                    : never)));

export type GetFormSampleValue2<TNode> =
    TNode extends FormSampleGroup<infer RGroupChildren>
        ? { [P in keyof RGroupChildren]?: GetFormSampleValue3<RGroupChildren[P]> }
        : (TNode extends FormSampleArray<infer RArrayChildren>
            ? GetFormSampleValue3<ArrayItemOf<RArrayChildren>>[]
            : (TNode extends (FormSampleControl<infer R> | FormSampleNative<infer R>)
                ? R
                : (TNode extends (FormSamplePortal | FormSamplePlaceholder)
                    ? any
                    : never)));

export type GetFormSampleValue3<TNode> =
    TNode extends FormSampleGroup<infer RGroupChildren>
        ? { [P in keyof RGroupChildren]?: GetFormSampleValue4<RGroupChildren[P]> }
        : (TNode extends FormSampleArray<infer RArrayChildren>
            ? GetFormSampleValue4<ArrayItemOf<RArrayChildren>>[]
            : (TNode extends (FormSampleControl<infer R> | FormSampleNative<infer R>)
                ? R
                : (TNode extends (FormSamplePortal | FormSamplePlaceholder)
                    ? any
                    : never)));
                    
export type GetFormSampleValue4<TNode> =
    TNode extends FormSampleGroup<infer RGroupChildren>
        ? { [P in keyof RGroupChildren]?: GetFormSampleValue5<RGroupChildren[P]> }
        : (TNode extends FormSampleArray<infer RArrayChildren>
            ? GetFormSampleValue5<ArrayItemOf<RArrayChildren>>[]
            : (TNode extends (FormSampleControl<infer R> | FormSampleNative<infer R>)
                ? R
                : (TNode extends (FormSamplePortal | FormSamplePlaceholder)
                    ? any
                    : never)));

export type GetFormSampleValue5<TNode> =
    TNode extends FormSampleGroup<infer RGroupChildren>
        ? { [P in keyof RGroupChildren]?: GetFormSampleValue6<RGroupChildren[P]> }
        : (TNode extends FormSampleArray<infer RArrayChildren>
            ? GetFormSampleValue6<ArrayItemOf<RArrayChildren>>[]
            : (TNode extends (FormSampleControl<infer R> | FormSampleNative<infer R>)
                ? R
                : (TNode extends (FormSamplePortal | FormSamplePlaceholder)
                    ? any
                    : never)));

export type GetFormSampleValue6<TNode> = any;