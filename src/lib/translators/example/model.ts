import { AbstractControl } from '@angular/forms';
import { ArrayItemOf, PredicateFn } from '../../common';
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
}

export type SampleEnvironmentPredicate = PredicateFn<SampleEnvironment>;

export interface FormSampleNodeBase {
    key?: any;
    type: FormSampleNodeType;
    visible: SampleEnvironmentPredicate;
    disabled: SampleEnvironmentPredicate;
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
        ? ExtractFormSampleValue<TValue[P], TFormGroupChildren[P]>
        : FieldToRemove;
}>;

type FormArrayValueOf<TValue extends any[], TFormArrayChildren extends FormSampleArrayChildren> =
    ExtractFormSampleValue<ArrayItemOf<TValue>, ArrayItemOf<TFormArrayChildren>>[];

export type ExtractFormSampleValue<TValue, TNode> =
    TNode extends FormSampleOptions<infer ROptionsChild>
        ? ExtractFormSampleValue<TValue, ROptionsChild>
        : (TNode extends FormSampleGroup<infer RGroupChildren>
            ? (TValue extends object ? FormSampleGroupValueOf<TValue, RGroupChildren> : never)
            : (TNode extends FormSampleArray<infer RArrayChildren>
                ? (TValue extends any[] ? FormArrayValueOf<TValue, RArrayChildren> : never)
                : (TNode extends (FormSampleControl<any> | FormSampleNative<any> | FormSamplePortal | FormSamplePlaceholder)
                    ? TValue
                    : never)));

export type GetFormSampleValue<TNode> =
    TNode extends FormSampleGroup<infer RGroupChildren>
        ? { [P in keyof RGroupChildren]?: GetFormSampleValue<RGroupChildren[P]> }
        : (TNode extends FormSampleArray<infer RArrayChildren>
            ? GetFormSampleValue<ArrayItemOf<RArrayChildren>>[]
            : (TNode extends (FormSampleControl<infer R> | FormSampleNative<infer R>)
                ? R
                : (TNode extends (FormSamplePortal | FormSamplePlaceholder)
                    ? any
                    : never)));
