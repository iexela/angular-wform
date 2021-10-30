import { ValidatorFn, Validators } from '@angular/forms';
import { VFormNode } from '.';
import { Maybe } from './common';
import { VFormArray, VFormControl, VFormGroup, VFormNodeType, VValidatorNode } from './model';
import { arrayify } from './utils';
import { andValidators, composeValidators, vValidator } from './validators';

type AnyValidator = ValidatorFn | VValidatorNode | (ValidatorFn | VValidatorNode)[];

type MakeOptions<T> = Partial<Omit<T, 'type' | 'validator'>> & {
    validator?: AnyValidator,
};

export type VFormControlOptions = MakeOptions<VFormControl> & { required?: boolean };
export type VFormGroupOptions = Omit<MakeOptions<VFormGroup>, 'children'>;
export type VFormGroupChildren = Record<string, VFormNode>;
export type VFormArrayOptions = Omit<MakeOptions<VFormArray>, 'children'>;
export type VFormArrayChildren = VFormNode[];

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

export function vControl(options?: VFormControlOptions): VFormControl {
    return {
        type: VFormNodeType.Control,
        disabled: false,
        data: EMPTY_DATA,
        ...options,
        validator: options && createControlValidator(options),
    };
}

export function vGroup(children: VFormGroupChildren): VFormGroup;
export function vGroup(options: VFormGroupOptions, children: VFormGroupChildren): VFormGroup;
export function vGroup(optionsOrChildren: VFormGroupOptions | Record<string, VFormNode>,
                       children?: VFormGroupChildren): VFormGroup {
    const options: VFormGroupOptions = children ? optionsOrChildren as VFormGroupOptions : {};
    children = children || optionsOrChildren as VFormGroupChildren;

    return {
        type: VFormNodeType.Group,
        disabled: false,
        data: EMPTY_DATA,
        ...options,
        validator: options && createValidator(options.validator),
        children,
    };
}

export function vArray(children: VFormArrayChildren): VFormArray;
export function vArray(options: VFormArrayOptions, children: VFormArrayChildren): VFormArray;
export function vArray(optionsOrChildren: VFormArrayOptions | VFormArrayChildren, children?: VFormArrayChildren): VFormArray {
    const options: VFormArrayOptions = children ? optionsOrChildren as VFormArrayOptions : {};
    children = children || optionsOrChildren as VFormArrayChildren;

    return {
        type: VFormNodeType.Array,
        disabled: false,
        data: EMPTY_DATA,
        ...options,
        validator: options && createValidator(options.validator),
        children,
    };
}
