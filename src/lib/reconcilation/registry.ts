import { AbstractControl } from '@angular/forms';
import { VFormNode } from '..';
import { createValidatorBundle, ValidatorBundle } from './internal-model';

export interface VRenderResult {
    node: VFormNode;
    validator: ValidatorBundle;
}

const results = new WeakMap<AbstractControl, VRenderResult>();

export function registerRenderResult(control: AbstractControl, result: VRenderResult): void {
    results.set(control, result);
}

export function getLastFormNode(control: AbstractControl): VFormNode {
    const result = results.get(control);

    if (!result) {
        throw new Error('FormNode has been never rendered');
    }

    return result.node;
}

export function getLastValidatorBundle(control: AbstractControl): ValidatorBundle {
    const result = results.get(control);

    if (!result) {
        return createValidatorBundle([]);
    }

    return result.validator;
}
