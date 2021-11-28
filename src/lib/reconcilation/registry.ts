import { AbstractControl } from '@angular/forms';
import { VThisFormNode } from '..';
import { Maybe } from '../common';
import { AsyncValidatorBundle, createAsyncValidatorBundle, createValidatorBundle, ValidatorBundle } from './internal-model';

export interface VRenderResult {
    node: VThisFormNode;
    validator: ValidatorBundle;
    asyncValidator: AsyncValidatorBundle;
}

export interface VRoot {
    disabled: boolean;
}

const results = new WeakMap<AbstractControl, VRenderResult>();

const roots = new WeakMap<AbstractControl, VRoot>();

export function registerRenderResult(control: AbstractControl, result: VRenderResult): void {
    results.set(control, result);
}

export function getLastFormNodeOrNothing(control: AbstractControl): Maybe<VThisFormNode> {
    const result = results.get(control);

    if (!result) {
        return;
    }

    return result.node;
}

export function getLastFormNode(control: AbstractControl): VThisFormNode {
    const result = results.get(control);

    if (!result) {
        throw new Error('FormNode has been never rendered');
    }

    return result.node;
}

export function getLastValidatorBundleOrCreate(control: AbstractControl): ValidatorBundle {
    const result = results.get(control);

    if (!result) {
        return createValidatorBundle([]);
    }

    return result.validator;
}

export function getLastAsyncValidatorBundle(control: AbstractControl): AsyncValidatorBundle {
    const result = results.get(control);

    if (!result) {
        return createAsyncValidatorBundle([]);
    }

    return result.asyncValidator;
}

export function registerRoot(control: AbstractControl, root: VRoot): void {
    roots.set(control, root);
}

export function getRoot(control: AbstractControl): Maybe<VRoot> {
    return roots.get(control);
}
