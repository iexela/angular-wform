import { AbstractControl, AsyncValidatorFn, ValidatorFn, Validators } from '@angular/forms';
import { Nullable } from '../common';

export interface ValidatorBundle {
    children: ValidatorFn[];
    compiled?: CompiledValidatorFn;
}

export interface CompiledValidatorFn extends ValidatorFn {
    setValidators(validators: ValidatorFn[]): void;
    dispose(): void;
}

export interface AsyncValidatorBundle {
    children: AsyncValidatorFn[];
    compiled?: CompiledAsyncValidatorFn;
}

export interface CompiledAsyncValidatorFn extends AsyncValidatorFn {
    setAsyncValidators(validators: AsyncValidatorFn[]): void;
    dispose(): void;
}

const CompiledValidatorFnMarker = Symbol('compiled-validator-fn');
const CompiledAsyncValidatorFnMarker = Symbol('compiled-async-validator-fn');

export function createValidatorBundle(children: ValidatorFn[]): ValidatorBundle {
    return {
        children,
        compiled: children.length ? createCompiledValidator(children) : undefined,
    };
}

function createCompiledValidator(children: ValidatorFn[]): CompiledValidatorFn {
    let composed: Nullable<ValidatorFn> = Validators.compose(children);
    children = [];

    const compiled = (control: AbstractControl) => {
        if (composed) {
            return composed(control);
        }
        return null;
    };

    (compiled as any)[CompiledValidatorFnMarker] = true;

    compiled.setValidators = (validators: ValidatorFn[]) => {
        composed = Validators.compose(validators);
    };
    compiled.dispose = () => {
        composed = null;
    };

    return compiled;
}

export function createAsyncValidatorBundle(children: AsyncValidatorFn[]): AsyncValidatorBundle {
    return {
        children,
        compiled: children.length ? createCompiledAsyncValidator(children) : undefined,
    };
}

function createCompiledAsyncValidator(children: AsyncValidatorFn[]): CompiledAsyncValidatorFn {
    let composed: Nullable<AsyncValidatorFn> = Validators.composeAsync(children);
    children = [];

    const compiled = (control: AbstractControl) => {
        if (composed) {
            return composed(control);
        }
        return Promise.resolve(null);
    };

    (compiled as any)[CompiledAsyncValidatorFnMarker] = true;

    compiled.setAsyncValidators = (validators: AsyncValidatorFn[]) => {
        composed = Validators.composeAsync(validators);
    };
    compiled.dispose = () => {
        composed = null;
    };

    return compiled;
}
