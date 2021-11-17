import { AbstractControl, ValidatorFn, Validators } from '@angular/forms';
import { Nullable } from '../common';

export interface ValidatorBundle {
    children: ValidatorFn[];
    compiled?: CompiledValidatorFn;
}

export interface CompiledValidatorFn extends ValidatorFn {
    setValidators(validators: ValidatorFn[]): void;
    dispose(): void;
}

const CompiledValidatorFnMarker = Symbol('compiled-validator-fn');

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