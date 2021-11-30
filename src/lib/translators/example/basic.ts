import { AbstractControl, AsyncValidatorFn, ValidatorFn } from '@angular/forms';
import { VAsyncValidatorNode, VValidatorNode } from 'src/lib';
import { Maybe } from 'src/lib/common';
import { arrayify } from '../../utils';
import { composeAsyncValidators, composeValidators } from '../../validators';
import { toCondition, whenAll } from './conditions';
import { VEnvFormArray, VEnvFormControl, VEnvFormGroup, VEnvFormNative, VEnvFormNode, VEnvFormNodeType, VEnvFormOptions, VEnvFormPlaceholder, VEnvFormPortal, VEnvPredicate } from './model';

type AnyValidator = ValidatorFn | VValidatorNode | (ValidatorFn | VValidatorNode)[];
type AnyAsyncValidator = AsyncValidatorFn | VAsyncValidatorNode | (AsyncValidatorFn | VAsyncValidatorNode)[];

type MakeOptions<T> = Partial<Omit<T, 'type' | 'validator' | 'asyncValidator' | 'disabled' | 'visible'>> & {
    disabled?: VFlag;
    visible?: VFlag;
    validator?: AnyValidator,
    asyncValidator?: AnyAsyncValidator,
};

export type VFlag = boolean | VEnvPredicate | (VEnvPredicate | boolean)[];

export type VEnvFormControlOptions = Omit<MakeOptions<VEnvFormControl>, 'required'> & { required?: VFlag };
export type VEnvFormGroupOptions = Omit<MakeOptions<VEnvFormGroup>, 'children'>;
export type VEnvFormGroupChildren = Record<string, VEnvFormNode | VEnvFormPlaceholder>;
export type VEnvFormArrayOptions = Omit<MakeOptions<VEnvFormArray>, 'children'>;
export type VEnvFormArrayChildren = (VEnvFormNode | VEnvFormPlaceholder)[];
export type VEnvFormNativeOptions = Omit<MakeOptions<VEnvFormNative>, 'control'>;
export type VEnvFormOptionsOptions = Omit<VEnvFormOptions, 'type' | 'child'>;

function createValidator(validator?: AnyValidator): Maybe<VValidatorNode> {
    return validator ? composeValidators(...arrayify(validator)) : undefined;
}

function createAsyncValidator(validator?: AnyAsyncValidator): Maybe<VAsyncValidatorNode> {
    return validator ? composeAsyncValidators(...arrayify(validator)) : undefined;
}

function resolveFlag(flag: Maybe<VFlag>, defaultValue: boolean): VEnvPredicate {
    if (typeof flag === 'function') {
        return flag;
    } else if (typeof flag === 'boolean') {
        return toCondition(flag);
    } else if (Array.isArray(flag)) {
        return whenAll(...flag);
    }

    return toCondition(defaultValue);
}

export function vEnvRoot(options: VEnvFormOptionsOptions & VEnvFormGroupOptions, children: VEnvFormGroupChildren): VEnvFormOptions {
    const { mode, ...groupOptions } = options;
    return vEnvOptions({ mode }, vEnvGroup(groupOptions, children));
}

export function vEnvOptions(options: VEnvFormOptionsOptions, node: VEnvFormNode): VEnvFormOptions {
    return {
        type: VEnvFormNodeType.Options,
        ...options,
        child: node,
    };
}

export function vEnvControl(options?: VEnvFormControlOptions): VEnvFormControl {
    return {
        type: VEnvFormNodeType.Control,
        ...options,
        visible: resolveFlag(options?.visible, true),
        disabled: resolveFlag(options?.disabled, false),
        required: resolveFlag(options?.required, false),
        validator: options && createValidator(options.validator) || undefined,
        asyncValidator: options && createAsyncValidator(options.asyncValidator),
    };
}

export function vEnvGroup(children: VEnvFormGroupChildren): VEnvFormGroup;
export function vEnvGroup(options: VEnvFormGroupOptions, children: VEnvFormGroupChildren): VEnvFormGroup;
export function vEnvGroup(optionsOrChildren?: VEnvFormGroupOptions | VEnvFormGroupChildren, childrenOrNil?: VEnvFormGroupChildren): VEnvFormGroup {
    const children = childrenOrNil ? childrenOrNil : (optionsOrChildren as VEnvFormGroupChildren || {});
    const options = childrenOrNil ? optionsOrChildren as VEnvFormGroupOptions : undefined;
    return {
        type: VEnvFormNodeType.Group,
        ...options,
        visible: resolveFlag(options?.visible, true),
        disabled: resolveFlag(options?.disabled, false),
        validator: options && createValidator(options.validator) || undefined,
        asyncValidator: options && createAsyncValidator(options.asyncValidator) || undefined,
        children,
    };
}

export function vEnvArray(children: VEnvFormArrayChildren): VEnvFormArray;
export function vEnvArray(options: VEnvFormArrayOptions, children: VEnvFormArrayChildren): VEnvFormArray;
export function vEnvArray(optionsOrChildren: VEnvFormArrayOptions | VEnvFormArrayChildren, childrenOrNil?: VEnvFormArrayChildren): VEnvFormArray {
    const children = childrenOrNil ? childrenOrNil : (optionsOrChildren as VEnvFormArrayChildren || {});
    const options = childrenOrNil ? optionsOrChildren as VEnvFormArrayOptions : undefined;
    return {
        type: VEnvFormNodeType.Array,
        ...options,
        visible: resolveFlag(options?.visible, true),
        disabled: resolveFlag(options?.disabled, false),
        validator: options && createValidator(options.validator) || undefined,
        asyncValidator: options && createAsyncValidator(options.asyncValidator) || undefined,
        children,
    };
}

export function vEnvSkip(): VEnvFormPlaceholder {
    return {
        type: VEnvFormNodeType.Placeholder,
    };
}

export function vEnvNative(control?: AbstractControl, options?: VEnvFormNativeOptions): VEnvFormNative {
    return {
        type: VEnvFormNodeType.Native,
        control,
        ...options,
        visible: resolveFlag(options?.visible, true),
        disabled: resolveFlag(options?.disabled, false),
        validator: options && createValidator(options.validator) || undefined,
        asyncValidator: options && createAsyncValidator(options.asyncValidator) || undefined,
    };
}

export function vEnvPortal(name: string): VEnvFormPortal {
    return {
        type: VEnvFormNodeType.Portal,
        name,
    };
}
