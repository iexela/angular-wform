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

export function createValidatorBundle(disposable: ValidatorFn[], persistent?: ValidatorFn): ValidatorBundle {
    return {
        children: disposable,
        compiled: disposable.length || persistent ? createCompiledValidator(disposable, persistent) : undefined,
    };
}

function createCompiledValidator(disposable: ValidatorFn[], persistent?: ValidatorFn): CompiledValidatorFn {
    let composed: Nullable<ValidatorFn> = Validators.compose(
        persistent ? disposable.concat([persistent]) : disposable);
    let isDisposed = false;
    disposable = [];

    const compiled = (control: AbstractControl) => {
        if (composed) {
            return composed(control);
        }
        return null;
    };

    (compiled as any)[CompiledValidatorFnMarker] = true;

    compiled.setValidators = (validators: ValidatorFn[]) => {
        if (isDisposed) {
            throw Error('Async compiled validator is being changed when it is already in disposed state');
        }
        composed = Validators.compose(persistent ? validators.concat([persistent]) : validators);
    };
    compiled.dispose = () => {
        isDisposed = true;
        composed = persistent || null;
    };

    return compiled;
}

export function createAsyncValidatorBundle(disposable: AsyncValidatorFn[], persistent?: AsyncValidatorFn): AsyncValidatorBundle {
    return {
        children: disposable,
        compiled: disposable.length || persistent ? createCompiledAsyncValidator(disposable, persistent) : undefined,
    };
}

function createCompiledAsyncValidator(disposable: AsyncValidatorFn[], persistent?: AsyncValidatorFn): CompiledAsyncValidatorFn {
    let composed: Nullable<AsyncValidatorFn> = Validators.composeAsync(
        persistent ? disposable.concat([persistent]) : disposable);
    let isDisposed = false;
    disposable = [];

    const compiled = (control: AbstractControl) => {
        if (composed) {
            return composed(control);
        }
        return Promise.resolve(null);
    };

    (compiled as any)[CompiledAsyncValidatorFnMarker] = true;

    compiled.setAsyncValidators = (validators: AsyncValidatorFn[]) => {
        if (isDisposed) {
            throw Error('Async compiled validator is being changed when it is already in disposed state');
        }
        composed = Validators.composeAsync(persistent ? validators.concat([persistent]) : validators);
    };
    compiled.dispose = () => {
        isDisposed = true;
        composed = persistent || null;
    };

    return compiled;
}
