import { AsyncValidatorFn, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { concat, defer, forkJoin } from 'rxjs';
import { first, map } from 'rxjs/operators';
import { isAsyncValidatorNode, VAsyncCompoundValidatorNode, VAsyncFactoryValidatorNode, VAsyncSimpleValidatorNode, VAsyncValidatorFactory, VAsyncValidatorMixer, VAsyncValidatorNode, VAsyncValidatorNodeType } from '.';
import { Nullable } from './common';
import { isValidatorNode, VCompoundValidatorNode, VFactoryValidatorNode, VSimpleValidatorNode, VValidatorFactory, VValidatorMixer, VValidatorNode, VValidatorNodeType } from './model';

// Validators

export function vValidator<T>(validator: ValidatorFn, locals?: any[]): VSimpleValidatorNode {
    return {
        type: VValidatorNodeType.Simple,
        validator,
        locals,
    };
}

export type VValidatorFactory0<T> = () => ValidatorFn;
export type VValidatorFactory1<T, A1> = (a1: A1) => ValidatorFn;
export type VValidatorFactory2<T, A1, A2> = (a1: A1, a2: A2) => ValidatorFn;
export type VValidatorFactory3<T, A1, A2, A3> = (a1: A1, a2: A2, a3: A3) => ValidatorFn;

export function vValidatorFactory<T>(factory: VValidatorFactory0<T>): () => VFactoryValidatorNode;
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

export function vCompoundValidator<T>(mixer: VValidatorMixer<T>): (...validatorsAndNodes: (ValidatorFn | VValidatorNode)[]) => VCompoundValidatorNode {
    return function() {
        const nodes = Array.from(arguments).map(item => isValidatorNode(item) ? item : vValidator(item));
        return {
            type: VValidatorNodeType.Compound,
            mixer,
            children: nodes,
        };
    };
}

export const andValidators = vCompoundValidator(validators => {
    if (validators.length === 0) {
        return validators;
    }
    return control => validators.reduce((errors, validator) => errors || validator(control), null as ReturnType<ValidatorFn>);
});

export const orValidators = vCompoundValidator(validators => {
    if (validators.length === 0) {
        return validators;
    }
    return control => {
        const errors = validators.map(validator => validator(control));
        return errors.every(Boolean) ? mergeErrors(errors) : null;
    };
});
    
export const composeValidators = vCompoundValidator(validators => validators);

// Async validators

export function vValidatorAsync<T>(validator: AsyncValidatorFn, locals?: any[]): VAsyncSimpleValidatorNode {
    return {
        type: VAsyncValidatorNodeType.Simple,
        validator,
        locals,
    };
}

export type VAsyncValidatorFactory0<T> = () => AsyncValidatorFn;
export type VAsyncValidatorFactory1<T, A1> = (a1: A1) => AsyncValidatorFn;
export type VAsyncValidatorFactory2<T, A1, A2> = (a1: A1, a2: A2) => AsyncValidatorFn;
export type VAsyncValidatorFactory3<T, A1, A2, A3> = (a1: A1, a2: A2, a3: A3) => AsyncValidatorFn;

export function vValidatorFactoryAsync<T>(factory: VAsyncValidatorFactory0<T>): () => VAsyncFactoryValidatorNode;
export function vValidatorFactoryAsync<T, A1>(factory: VAsyncValidatorFactory1<T, A1>): (a1: A1) => VAsyncFactoryValidatorNode;
export function vValidatorFactoryAsync<T, A1, A2>(factory: VAsyncValidatorFactory2<T, A1, A2>): (a1: A1, a2: A2) => VAsyncFactoryValidatorNode;
export function vValidatorFactoryAsync<T, A1, A2, A3>(factory: VAsyncValidatorFactory3<T, A1, A2, A3>): (a1: A1, a2: A2, a3: A3) => VAsyncFactoryValidatorNode;
export function vValidatorFactoryAsync<T>(factory: VAsyncValidatorFactory): (args: any[]) => VAsyncFactoryValidatorNode {
    return (...args) => ({
        type: VAsyncValidatorNodeType.Factory,
        factory,
        args,
    });
}

export function vCompoundValidatorAsync<T>(mixer: VAsyncValidatorMixer<T>): (...validatorsAndNodes: (AsyncValidatorFn | VAsyncValidatorNode)[]) => VAsyncCompoundValidatorNode {
    return function() {
        const nodes = Array.from(arguments).map(item => isAsyncValidatorNode(item) ? item : vValidatorAsync(item));
        return {
            type: VAsyncValidatorNodeType.Compound,
            mixer,
            children: nodes,
        };
    };
}

export const andAsyncValidators = vCompoundValidatorAsync(validators => {
    if (validators.length === 0) {
        return validators;
    }
    return control =>
        concat(...validators.map(v => defer(() => v(control))))
            .pipe(first<Nullable<ValidationErrors>>(Boolean, null));
});

export const orAsyncValidators = vCompoundValidatorAsync(validators => {
    if (validators.length === 0) {
        return validators;
    }
    return control =>
        forkJoin(validators.map(v => defer(() => v(control))))
            .pipe(map(errors => errors.every(Boolean) ? mergeErrors(errors) : null));
});
    
export const composeAsyncValidators = vCompoundValidatorAsync(validators => validators);

// Validator factories

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
    composeAsync: composeAsyncValidators,
    andAsync: andAsyncValidators,
    orAsync: orAsyncValidators,
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
