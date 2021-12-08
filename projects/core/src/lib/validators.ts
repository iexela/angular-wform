import { AsyncValidatorFn, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { concat, defer, forkJoin } from 'rxjs';
import { first, map } from 'rxjs/operators';
import { isAsyncValidatorNode, WAsyncCompoundValidatorNode, WAsyncFactoryValidatorNode, WAsyncSimpleValidatorNode, WAsyncValidatorFactory, WAsyncValidatorMixer, WAsyncValidatorNode, WAsyncValidatorNodeType } from './model';
import { Nullable } from './common';
import { isValidatorNode, WCompoundValidatorNode, WFactoryValidatorNode, WSimpleValidatorNode, WValidatorFactory, WValidatorMixer, WValidatorNode, WValidatorNodeType } from './model';

// Validators

export function wValidator<T>(validator: ValidatorFn, locals?: any[]): WSimpleValidatorNode {
    return {
        type: WValidatorNodeType.Simple,
        validator,
        locals,
    };
}

export type WValidatorFactory0<T> = () => ValidatorFn;
export type WValidatorFactory1<T, A1> = (a1: A1) => ValidatorFn;
export type WValidatorFactory2<T, A1, A2> = (a1: A1, a2: A2) => ValidatorFn;
export type WValidatorFactory3<T, A1, A2, A3> = (a1: A1, a2: A2, a3: A3) => ValidatorFn;

export function wValidatorFactory<T>(factory: WValidatorFactory0<T>): () => WFactoryValidatorNode;
export function wValidatorFactory<T, A1>(factory: WValidatorFactory1<T, A1>): (a1: A1) => WFactoryValidatorNode;
export function wValidatorFactory<T, A1, A2>(factory: WValidatorFactory2<T, A1, A2>): (a1: A1, a2: A2) => WFactoryValidatorNode;
export function wValidatorFactory<T, A1, A2, A3>(factory: WValidatorFactory3<T, A1, A2, A3>): (a1: A1, a2: A2, a3: A3) => WFactoryValidatorNode;
export function wValidatorFactory<T>(factory: WValidatorFactory): (args: any[]) => WFactoryValidatorNode {
    return (...args) => ({
        type: WValidatorNodeType.Factory,
        factory,
        args,
    });
}

export function wCompoundValidator<T>(mixer: WValidatorMixer<T>): (...validatorsAndNodes: (ValidatorFn | WValidatorNode)[]) => WCompoundValidatorNode {
    return function() {
        const nodes = Array.from(arguments).map(item => isValidatorNode(item) ? item : wValidator(item));
        return {
            type: WValidatorNodeType.Compound,
            mixer,
            children: nodes,
        };
    };
}

export const andValidators = wCompoundValidator(validators => {
    if (validators.length === 0) {
        return validators;
    }
    return control => validators.reduce((errors, validator) => errors || validator(control), null as ReturnType<ValidatorFn>);
});

export const orValidators = wCompoundValidator(validators => {
    if (validators.length === 0) {
        return validators;
    }
    return control => {
        const errors = validators.map(validator => validator(control));
        return errors.every(Boolean) ? mergeErrors(errors) : null;
    };
});
    
export const composeValidators = wCompoundValidator(validators => validators);

// Async validators

export function wValidatorAsync<T>(validator: AsyncValidatorFn, locals?: any[]): WAsyncSimpleValidatorNode {
    return {
        type: WAsyncValidatorNodeType.Simple,
        validator,
        locals,
    };
}

export type WAsyncValidatorFactory0<T> = () => AsyncValidatorFn;
export type WAsyncValidatorFactory1<T, A1> = (a1: A1) => AsyncValidatorFn;
export type WAsyncValidatorFactory2<T, A1, A2> = (a1: A1, a2: A2) => AsyncValidatorFn;
export type WAsyncValidatorFactory3<T, A1, A2, A3> = (a1: A1, a2: A2, a3: A3) => AsyncValidatorFn;

export function wValidatorFactoryAsync<T>(factory: WAsyncValidatorFactory0<T>): () => WAsyncFactoryValidatorNode;
export function wValidatorFactoryAsync<T, A1>(factory: WAsyncValidatorFactory1<T, A1>): (a1: A1) => WAsyncFactoryValidatorNode;
export function wValidatorFactoryAsync<T, A1, A2>(factory: WAsyncValidatorFactory2<T, A1, A2>): (a1: A1, a2: A2) => WAsyncFactoryValidatorNode;
export function wValidatorFactoryAsync<T, A1, A2, A3>(factory: WAsyncValidatorFactory3<T, A1, A2, A3>): (a1: A1, a2: A2, a3: A3) => WAsyncFactoryValidatorNode;
export function wValidatorFactoryAsync<T>(factory: WAsyncValidatorFactory): (args: any[]) => WAsyncFactoryValidatorNode {
    return (...args) => ({
        type: WAsyncValidatorNodeType.Factory,
        factory,
        args,
    });
}

export function wCompoundValidatorAsync<T>(mixer: WAsyncValidatorMixer<T>): (...validatorsAndNodes: (AsyncValidatorFn | WAsyncValidatorNode)[]) => WAsyncCompoundValidatorNode {
    return function() {
        const nodes = Array.from(arguments).map(item => isAsyncValidatorNode(item) ? item : wValidatorAsync(item));
        return {
            type: WAsyncValidatorNodeType.Compound,
            mixer,
            children: nodes,
        };
    };
}

export const andAsyncValidators = wCompoundValidatorAsync(validators => {
    if (validators.length === 0) {
        return validators;
    }
    return control =>
        concat(...validators.map(v => defer(() => v(control))))
            .pipe(first<Nullable<ValidationErrors>>(Boolean, null));
});

export const orAsyncValidators = wCompoundValidatorAsync(validators => {
    if (validators.length === 0) {
        return validators;
    }
    return control =>
        forkJoin(validators.map(v => defer(() => v(control))))
            .pipe(map(errors => errors.every(Boolean) ? mergeErrors(errors) : null));
});
    
export const composeAsyncValidators = wCompoundValidatorAsync(validators => validators);

// Validator factories

export const WValidators = {
    min: wValidatorFactory(Validators.min),
    max: wValidatorFactory(Validators.max),
    required: wValidator(Validators.required),
    requiredTrue: wValidator(Validators.requiredTrue),
    email: wValidator(Validators.email),
    minLength: wValidatorFactory(Validators.minLength),
    maxLength: wValidatorFactory(Validators.maxLength),
    pattern: wValidatorFactory(Validators.pattern),
    nullValidator: wValidator(Validators.nullValidator),
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
