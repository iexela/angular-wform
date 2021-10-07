import { ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { Nullable } from './common';
import { isValidatorNode, VCompoundValidatorNode, VFactoryValidatorNode, VSimpleValidatorNode, VValidatorFactory, VValidatorMixer, VValidatorNode, VValidatorNodeType } from './model';

export function vValidator<T>(validator: ValidatorFn, locals?: any[]): VSimpleValidatorNode {
    return {
        type: VValidatorNodeType.Simple,
        validator,
        locals,
    };
}

export type VValidatorFactory1<T, A1> = (a1: A1) => ValidatorFn;
export type VValidatorFactory2<T, A1, A2> = (a1: A1, a2: A2) => ValidatorFn;
export type VValidatorFactory3<T, A1, A2, A3> = (a1: A1, a2: A2, a3: A3) => ValidatorFn;

export function vValidatorFactory<T, A1>(factory: VValidatorFactory1<T, A1>): (a1: A1) => VFactoryValidatorNode;
export function vValidatorFactory<T, A1, A2>(factory: VValidatorFactory2<T, A1, A2>): (a1: A1, a2: A2) => VFactoryValidatorNode;
export function vValidatorFactory<T, A1, A2, A3>(factory: VValidatorFactory3<T, A1, A2, A3>): (a1: A1, a2: A2, a3: A3) => VFactoryValidatorNode;
export function vValidatorFactory<T>(factory: VValidatorFactory): (args: any[]) => VFactoryValidatorNode {
    return (...args) => ({
        type: VValidatorNodeType.Factory,
        factory,
        args,
    });
}

export function vCompoundValidator<T>(mixer: VValidatorMixer<T>): (validatorsAndNodes: (ValidatorFn | VValidatorNode)[]) => VCompoundValidatorNode {
    return validatorsAndNodes => {
        const nodes = validatorsAndNodes.map(item => isValidatorNode(item) ? item : vValidator(item));
        return {
            type: VValidatorNodeType.Compound,
            mixer,
            children: nodes,
        };
    };
}

export const andValidators = vCompoundValidator(validators =>
    control => validators.reduce((errors, validator) => errors || validator(control), null as ReturnType<ValidatorFn>));

export const orValidators = vCompoundValidator(validators =>
    control => {
        const errors = validators.map(validator => validator(control));
        return errors.every(Boolean) ? mergeErrors(errors) : null;
    });
    
export const composeValidators = vCompoundValidator(validators => validators);

export const VValidators = {
    min: vValidatorFactory(Validators.min),
    max: vValidatorFactory(Validators.max),
    required: vValidator(Validators.required),
    requiredTrue: vValidator(Validators.requiredTrue),
    email: vValidator(Validators.email),
    minLength: vValidatorFactory(Validators.minLength),
    maxLength: vValidatorFactory(Validators.maxLength),
    pattern: vValidatorFactory(Validators.pattern),
    nullValidator: vValidator(Validators.nullValidator),
    compose: composeValidators,
    and: andValidators,
    or: orValidators,
};

// This function was taken from @angular/forms codebase
function mergeErrors(arrayOfErrors: Nullable<ValidationErrors>[]): Nullable<ValidationErrors> {
    let res = {};
    // Not using Array.reduce here due to a Chrome 80 bug
    // https://bugs.chromium.org/p/chromium/issues/detail?id=1049982
    arrayOfErrors.forEach((errors) => {
        res = errors != null ? Object.assign(Object.assign({}, res), errors) : res;
    });
    return Object.keys(res).length === 0 ? null : res;
}
