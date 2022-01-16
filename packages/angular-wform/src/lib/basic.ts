import { AbstractControl, AsyncValidatorFn, ValidatorFn, Validators } from '@angular/forms';
import { WAsyncValidatorNode, WFormNative, WFormPlaceholder, WFormPortal } from './model';
import { Maybe, Omit } from './common';
import { WFormArray, WFormArrayChildren, WFormControl, WFormGroup, WFormGroupChildren, WFormNodeType, WValidatorNode } from './model';
import { arrayify } from './utils';
import { andValidators, composeAsyncValidators, composeValidators, wValidator } from './validators';

type AnyValidator = ValidatorFn | WValidatorNode | (ValidatorFn | WValidatorNode)[];
type AnyAsyncValidator = AsyncValidatorFn | WAsyncValidatorNode | (AsyncValidatorFn | WAsyncValidatorNode)[];

type MakeOptions<T> = Partial<Omit<T, 'type' | 'validator' | 'asyncValidator'>> & {
    validator?: AnyValidator,
    asyncValidator?: AnyAsyncValidator,
};

export type WFormControlOptions<T> = MakeOptions<WFormControl<T>> & { required?: boolean };
export type WFormGroupOptions = Omit<MakeOptions<WFormGroup<any>>, 'children'>;
export type WFormArrayOptions = Omit<MakeOptions<WFormArray<any>>, 'children'>;
export type WFormNativeOptions<T> = Omit<MakeOptions<WFormNative<T>>, 'control'>;

const EMPTY_DATA = Object.freeze({});

function createControlValidator<T>(options: WFormControlOptions<T>): Maybe<WValidatorNode> {
    if (options.validator && options.required) {
        return andValidators(Validators.required, composeValidators(...arrayify(options.validator)));
    } else if (options.validator) {
        return createValidator(options.validator);
    } else if (options.required) {
        return wValidator(Validators.required);
    }
    return;
}

function createValidator(validator?: AnyValidator): Maybe<WValidatorNode> {
    return validator ? composeValidators(...arrayify(validator)) : undefined;
}

function createAsyncValidator(validator?: AnyAsyncValidator): Maybe<WAsyncValidatorNode> {
    return validator ? composeAsyncValidators(...arrayify(validator)) : undefined;
}

export function wValue<T = any>(value: T, options?: Omit<WFormControlOptions<T>, 'value'>): WFormControl<T> {
    return wControl({
        ...options,
        value,
    });
}

export function wControl<T = any>(options?: WFormControlOptions<T>): WFormControl<T> {
    return {
        type: WFormNodeType.Control,
        disabled: false,
        data: EMPTY_DATA,
        ...options,
        validator: options && createControlValidator(options),
        asyncValidator: options && createAsyncValidator(options.asyncValidator),
    };
}

export function wGroup<C extends WFormGroupChildren>(children: C): WFormGroup<C>;
export function wGroup<C extends WFormGroupChildren>(options: WFormGroupOptions, children: C): WFormGroup<C>;
export function wGroup(optionsOrChildren?: WFormGroupOptions | WFormGroupChildren, childrenOrNil?: WFormGroupChildren): WFormGroup<any> {
    const children = childrenOrNil ? childrenOrNil : (optionsOrChildren as WFormGroupChildren || {});
    const options = childrenOrNil ? optionsOrChildren as WFormGroupOptions : undefined;
    return {
        type: WFormNodeType.Group,
        disabled: false,
        data: EMPTY_DATA,
        ...options,
        validator: options && createValidator(options.validator) || undefined,
        asyncValidator: options && createAsyncValidator(options.asyncValidator) || undefined,
        children,
    };
}

export function wArray<C extends WFormArrayChildren>(children: C): WFormArray<C>;
export function wArray<C extends WFormArrayChildren>(options: WFormArrayOptions, children: C): WFormArray<C>;
export function wArray(optionsOrChildren: WFormArrayOptions | WFormArrayChildren, childrenOrNil?: WFormArrayChildren): WFormArray<any> {
    const children = childrenOrNil ? childrenOrNil : (optionsOrChildren as WFormArrayChildren || {});
    const options = childrenOrNil ? optionsOrChildren as WFormArrayOptions : undefined;
    return {
        type: WFormNodeType.Array,
        disabled: false,
        data: EMPTY_DATA,
        ...options,
        validator: options && createValidator(options.validator) || undefined,
        asyncValidator: options && createAsyncValidator(options.asyncValidator) || undefined,
        children,
    };
}

export function wSkip(): WFormPlaceholder {
    return {
        type: WFormNodeType.Placeholder,
    };
}

export function wNative<T = any>(control?: AbstractControl, options?: WFormNativeOptions<T>): WFormNative<T> {
    return {
        type: WFormNodeType.Native,
        control,
        disabled: false,
        data: EMPTY_DATA,
        ...options,
        validator: options && createValidator(options.validator) || undefined,
        asyncValidator: options && createAsyncValidator(options.asyncValidator) || undefined,
    };
}

export function wPortal(name: string): WFormPortal {
    return {
        type: WFormNodeType.Portal,
        name,
    };
}
