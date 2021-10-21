import { ValidatorFn, Validators } from '@angular/forms';
import { Maybe } from './common';
import { VFormArray, VFormControl, VFormGroup, VFormNodeType, VValidatorNode } from './model';
import { arrayify } from './utils';
import { andValidators, composeValidators, vValidator } from './validators';

type AnyValidator = ValidatorFn | VValidatorNode | (ValidatorFn | VValidatorNode)[];

type MakeOptions<T> = Partial<Omit<T, 'type' | 'validator'>> & {
    validator?: AnyValidator,
};

export type VFormControlOptions = MakeOptions<VFormControl> & { required?: boolean };
export type VFormGroupOptions = MakeOptions<VFormGroup>;
export type VFormArrayOptions = MakeOptions<VFormArray>;

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

export function vGroup(options: VFormGroupOptions): VFormGroup {
    return {
        type: VFormNodeType.Group,
        disabled: false,
        data: EMPTY_DATA,
        children: {},
        ...options,
        validator: createValidator(options.validator),
    };
}

export function vArray(options: VFormArrayOptions): VFormArray {
    return {
        type: VFormNodeType.Array,
        disabled: false,
        data: EMPTY_DATA,
        children: [],
        ...options,
        validator: createValidator(options.validator),
    };
}
