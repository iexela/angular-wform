import { AbstractControl, AsyncValidatorFn, ValidatorFn, Validators } from '@angular/forms';
import { VAsyncValidatorNode, VFormNative, VFormNode, VFormPlaceholder } from '.';
import { Maybe, Nilable } from './common';
import { VFormArray, VFormControl, VFormGroup, VFormNodeType, VValidatorNode } from './model';
import { arrayify } from './utils';
import { andValidators, composeAsyncValidators, composeValidators, vValidator } from './validators';

type AnyValidator = ValidatorFn | VValidatorNode | (ValidatorFn | VValidatorNode)[];
type AnyAsyncValidator = AsyncValidatorFn | VAsyncValidatorNode | (AsyncValidatorFn | VAsyncValidatorNode)[];

type MakeOptions<T> = Partial<Omit<T, 'type' | 'validator' | 'asyncValidator'>> & {
    validator?: AnyValidator,
    asyncValidator?: AnyAsyncValidator,
};

export type VFormControlOptions = MakeOptions<VFormControl> & { required?: boolean };
export type VFormGroupOptions = Omit<MakeOptions<VFormGroup>, 'children'>;
export type VFormGroupChildren = Record<string, VFormNode | VFormPlaceholder>;
export type VFormArrayOptions = Omit<MakeOptions<VFormArray>, 'children'>;
export type VFormArrayChildren = (VFormNode | VFormPlaceholder)[];
export type VFormNativeOptions = Omit<MakeOptions<VFormNative>, 'control'>;

const EMPTY_DATA = Object.freeze({});

function createControlValidator(options: VFormControlOptions): Maybe<VValidatorNode> {
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

export function vControl(options?: VFormControlOptions): VFormControl {
    return {
        type: VFormNodeType.Control,
        disabled: false,
        data: EMPTY_DATA,
        ...options,
        validator: options && createControlValidator(options),
        asyncValidator: options && createAsyncValidator(options.asyncValidator),
    };
}

export function vGroup(children: VFormGroupChildren): VFormGroup;
export function vGroup(options: VFormGroupOptions, children: VFormGroupChildren): VFormGroup;
export function vGroup(optionsOrChildren?: VFormGroupOptions | VFormGroupChildren, childrenOrNil?: VFormGroupChildren): VFormGroup {
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

export function vArray(children: VFormArrayChildren): VFormArray;
export function vArray(options: VFormArrayOptions, children: VFormArrayChildren): VFormArray;
export function vArray(optionsOrChildren: VFormArrayOptions | VFormArrayChildren, childrenOrNil?: VFormArrayChildren): VFormArray {
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

export function vNative(control?: AbstractControl, options?: VFormNativeOptions): VFormNative {
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
