import { AbstractControl, AsyncValidatorFn, ValidatorFn } from '@angular/forms';
import { WAsyncValidatorNode, WValidatorNode } from '../../model';
import { Maybe } from '../../common';
import { arrayify } from '../../utils';
import { composeAsyncValidators, composeValidators } from '../../validators';
import { toCondition, whenAll } from './conditions';
import { FormSampleArray, FormSampleControl, FormSampleGroup, FormSampleNative, FormSampleNode, FormSampleNodeType, FormSampleNoOptionsNoOptions, FormSampleOptions, FormSamplePlaceholder, FormSamplePortal, SampleEnvironmentPredicate } from './model';

type AnyValidator = ValidatorFn | WValidatorNode | (ValidatorFn | WValidatorNode)[];
type AnyAsyncValidator = AsyncValidatorFn | WAsyncValidatorNode | (AsyncValidatorFn | WAsyncValidatorNode)[];

type MakeOptions<T> = Partial<Omit<T, 'type' | 'validator' | 'asyncValidator' | 'disabled' | 'visible'>> & {
    disabled?: SampleEnvironmentFlag;
    visible?: SampleEnvironmentFlag;
    validator?: AnyValidator,
    asyncValidator?: AnyAsyncValidator,
};

export type SampleEnvironmentFlag = boolean | SampleEnvironmentPredicate | (SampleEnvironmentPredicate | boolean)[];

export type FormSampleControlOptions<T> = Omit<MakeOptions<FormSampleControl<T>>, 'required'> & { required?: SampleEnvironmentFlag };
export type FormSampleGroupOptions = Omit<MakeOptions<FormSampleGroup<any>>, 'children'>;
export type FormSampleGroupChildren = Record<string, FormSampleNode | FormSamplePlaceholder>;
export type FormSampleArrayOptions = Omit<MakeOptions<FormSampleArray<any>>, 'children'>;
export type FormSampleArrayChildren = (FormSampleNode | FormSamplePlaceholder)[];
export type FormSampleNativeOptions<T> = Omit<MakeOptions<FormSampleNative<T>>, 'control'>;
export type FormSampleOptionsOptions = Omit<FormSampleOptions<any>, 'type' | 'child'>;

function createValidator(validator?: AnyValidator): Maybe<WValidatorNode> {
    return validator ? composeValidators(...arrayify(validator)) : undefined;
}

function createAsyncValidator(validator?: AnyAsyncValidator): Maybe<WAsyncValidatorNode> {
    return validator ? composeAsyncValidators(...arrayify(validator)) : undefined;
}

function resolveFlag(flag: Maybe<SampleEnvironmentFlag>, defaultValue: boolean): SampleEnvironmentPredicate {
    if (typeof flag === 'function') {
        return flag;
    } else if (typeof flag === 'boolean') {
        return toCondition(flag);
    } else if (Array.isArray(flag)) {
        return whenAll(...flag);
    }

    return toCondition(defaultValue);
}

export function sRoot<C extends FormSampleGroupChildren, G extends FormSampleGroup<C>>(options: FormSampleOptionsOptions & FormSampleGroupOptions, children: C): FormSampleOptions<G> {
    const { mode, ...groupOptions } = options;
    return sOptions({ mode }, sGroup(groupOptions, children)) as FormSampleOptions<G>;
}

export function sOptions<C extends FormSampleNoOptionsNoOptions>(options: FormSampleOptionsOptions, node: C): FormSampleOptions<C> {
    return {
        type: FormSampleNodeType.Options,
        ...options,
        child: node,
    };
}

export function sValue<T = any>(value: T, options?: Omit<FormSampleControlOptions<T>, 'value'>): FormSampleControl<T> {
    return sControl({
        ...options,
        value,
    });
}

export function sControl<T = any>(options?: FormSampleControlOptions<T>): FormSampleControl<T> {
    return {
        type: FormSampleNodeType.Control,
        ...options,
        visible: resolveFlag(options?.visible, true),
        disabled: resolveFlag(options?.disabled, false),
        required: resolveFlag(options?.required, false),
        validator: options && createValidator(options.validator) || undefined,
        asyncValidator: options && createAsyncValidator(options.asyncValidator),
    };
}

export function sGroup<C extends FormSampleGroupChildren>(children: C): FormSampleGroup<C>;
export function sGroup<C extends FormSampleGroupChildren>(options: FormSampleGroupOptions, children: C): FormSampleGroup<C>;
export function sGroup(optionsOrChildren?: FormSampleGroupOptions | FormSampleGroupChildren, childrenOrNil?: FormSampleGroupChildren): FormSampleGroup<any> {
    const children = childrenOrNil ? childrenOrNil : (optionsOrChildren as FormSampleGroupChildren || {});
    const options = childrenOrNil ? optionsOrChildren as FormSampleGroupOptions : undefined;
    return {
        type: FormSampleNodeType.Group,
        ...options,
        visible: resolveFlag(options?.visible, true),
        disabled: resolveFlag(options?.disabled, false),
        validator: options && createValidator(options.validator) || undefined,
        asyncValidator: options && createAsyncValidator(options.asyncValidator) || undefined,
        children,
    };
}

export function sArray<C extends FormSampleArrayChildren>(children: C): FormSampleArray<C>;
export function sArray<C extends FormSampleArrayChildren>(options: FormSampleArrayOptions, children: C): FormSampleArray<C>;
export function sArray(optionsOrChildren: FormSampleArrayOptions | FormSampleArrayChildren, childrenOrNil?: FormSampleArrayChildren): FormSampleArray<any> {
    const children = childrenOrNil ? childrenOrNil : (optionsOrChildren as FormSampleArrayChildren || {});
    const options = childrenOrNil ? optionsOrChildren as FormSampleArrayOptions : undefined;
    return {
        type: FormSampleNodeType.Array,
        ...options,
        visible: resolveFlag(options?.visible, true),
        disabled: resolveFlag(options?.disabled, false),
        validator: options && createValidator(options.validator) || undefined,
        asyncValidator: options && createAsyncValidator(options.asyncValidator) || undefined,
        children,
    };
}

export function sSkip(): FormSamplePlaceholder {
    return {
        type: FormSampleNodeType.Placeholder,
    };
}

export function sNative<T = any>(control?: AbstractControl, options?: FormSampleNativeOptions<T>): FormSampleNative<T> {
    return {
        type: FormSampleNodeType.Native,
        control,
        ...options,
        visible: resolveFlag(options?.visible, true),
        disabled: resolveFlag(options?.disabled, false),
        validator: options && createValidator(options.validator) || undefined,
        asyncValidator: options && createAsyncValidator(options.asyncValidator) || undefined,
    };
}

export function sPortal(name: string): FormSamplePortal {
    return {
        type: FormSampleNodeType.Portal,
        name,
    };
}
