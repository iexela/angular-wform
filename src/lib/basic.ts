import { AbstractControl, AsyncValidatorFn, ValidatorFn, Validators } from '@angular/forms';
import { VAsyncValidatorNode, VFormNative, VFormNode, VFormPlaceholder, VFormPortal } from '.';
import { Maybe, Nilable } from './common';
import { VFormArray, VFormArrayChildren, VFormControl, VFormGroup, VFormGroupChildren, VFormNodeType, VValidatorNode } from './model';
import { arrayify } from './utils';
import { andValidators, composeAsyncValidators, composeValidators, vValidator } from './validators';

type AnyValidator = ValidatorFn | VValidatorNode | (ValidatorFn | VValidatorNode)[];
type AnyAsyncValidator = AsyncValidatorFn | VAsyncValidatorNode | (AsyncValidatorFn | VAsyncValidatorNode)[];

type MakeOptions<T> = Partial<Omit<T, 'type' | 'validator' | 'asyncValidator'>> & {
    validator?: AnyValidator,
    asyncValidator?: AnyAsyncValidator,
};

export type VFormControlOptions<T> = MakeOptions<VFormControl<T>> & { required?: boolean };
export type VFormGroupOptions = Omit<MakeOptions<VFormGroup<any>>, 'children'>;
export type VFormArrayOptions = Omit<MakeOptions<VFormArray<any>>, 'children'>;
export type VFormNativeOptions<T> = Omit<MakeOptions<VFormNative<T>>, 'control'>;

const EMPTY_DATA = Object.freeze({});

function createControlValidator<T>(options: VFormControlOptions<T>): Maybe<VValidatorNode> {
    if (options.validator && options.required) {
        return andValidators(Validators.required, composeValidators(...arrayify(options.validator)));
    } else if (options.validator) {
        return createValidator(options.validator);
    } else if (options.required) {
        return vValidator(Validators.required);
    }
    return;
}

function createValidator(validator?: AnyValidator): Maybe<VValidatorNode> {
    return validator ? composeValidators(...arrayify(validator)) : undefined;
}

function createAsyncValidator(validator?: AnyAsyncValidator): Maybe<VAsyncValidatorNode> {
    return validator ? composeAsyncValidators(...arrayify(validator)) : undefined;
}

export function vControl<T = any>(options?: VFormControlOptions<T>): VFormControl<T> {
    return {
        type: VFormNodeType.Control,
        disabled: false,
        data: EMPTY_DATA,
        ...options,
        validator: options && createControlValidator(options),
        asyncValidator: options && createAsyncValidator(options.asyncValidator),
    };
}

export function vGroup<C extends VFormGroupChildren>(children: C): VFormGroup<C>;
export function vGroup<C extends VFormGroupChildren>(options: VFormGroupOptions, children: C): VFormGroup<C>;
export function vGroup(optionsOrChildren?: VFormGroupOptions | VFormGroupChildren, childrenOrNil?: VFormGroupChildren): VFormGroup<any> {
    const children = childrenOrNil ? childrenOrNil : (optionsOrChildren as VFormGroupChildren || {});
    const options = childrenOrNil ? optionsOrChildren as VFormGroupOptions : undefined;
    return {
        type: VFormNodeType.Group,
        disabled: false,
        data: EMPTY_DATA,
        ...options,
        validator: options && createValidator(options.validator) || undefined,
        asyncValidator: options && createAsyncValidator(options.asyncValidator) || undefined,
        children,
    };
}

export function vArray<C extends VFormArrayChildren>(children: C): VFormArray<C>;
export function vArray<C extends VFormArrayChildren>(options: VFormArrayOptions, children: C): VFormArray<C>;
export function vArray(optionsOrChildren: VFormArrayOptions | VFormArrayChildren, childrenOrNil?: VFormArrayChildren): VFormArray<any> {
    const children = childrenOrNil ? childrenOrNil : (optionsOrChildren as VFormArrayChildren || {});
    const options = childrenOrNil ? optionsOrChildren as VFormArrayOptions : undefined;
    return {
        type: VFormNodeType.Array,
        disabled: false,
        data: EMPTY_DATA,
        ...options,
        validator: options && createValidator(options.validator) || undefined,
        asyncValidator: options && createAsyncValidator(options.asyncValidator) || undefined,
        children,
    };
}

export function vSkip(): VFormPlaceholder {
    return {
        type: VFormNodeType.Placeholder,
    };
}

export function vNative<T = any>(control?: AbstractControl, options?: VFormNativeOptions<T>): VFormNative<T> {
    return {
        type: VFormNodeType.Native,
        control,
        disabled: false,
        data: EMPTY_DATA,
        ...options,
        validator: options && createValidator(options.validator) || undefined,
        asyncValidator: options && createAsyncValidator(options.asyncValidator) || undefined,
    };
}

export function vPortal(name: string): VFormPortal {
    return {
        type: VFormNodeType.Portal,
        name,
    };
}
