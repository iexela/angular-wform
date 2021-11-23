import { AbstractControl, FormArray, FormControl, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { Nullable } from '../common';
import { VFormArray, VFormControl, VFormGroup, VFormNode, VFormNodeType, VValidatorNode, VValidatorNodeType } from '../model';
import { VRenderContext } from './render-context';
import { arrayDiff, arrayDiffUnordered, arrayify, flatMap, hasField, isAngularAtLeast, mapValues, objectDiff } from '../utils';
import { getLastFormNode, registerRenderResult } from './registry';
import { processValidators } from './validators';
import { processAsyncValidators } from './validators-async';

function restoreFormNode(control: AbstractControl): VFormNode {
    // TODO: consider the case when control is not managed by vform
    return getLastFormNode(control);
}

export function processNode(ctx: VRenderContext, node: VFormNode, control?: AbstractControl): AbstractControl {
    switch (node.type) {
        case VFormNodeType.Control:
            return processControl(ctx, node, control);
        case VFormNodeType.Group:
            return processGroup(ctx, node, control as FormGroup);
        case VFormNodeType.Array:
            return processArray(ctx, node, control as FormArray);
        default:
            throw Error(`Unsupported node type`);
    }
}

function processControl(ctx: VRenderContext, node: VFormControl, control?: AbstractControl): AbstractControl {
    if (!node || !control) {
        const validator = processValidators(ctx, node.validator);
        const asyncValidator = processAsyncValidators(ctx, node.asyncValidator);
        const newControl = new FormControl({
            value: node.value,
            disabled: ctx.tryDisabled(node.disabled),
        }, {
            asyncValidators: asyncValidator.compiled,
            validators: validator.compiled,
            updateOn: node.updateOn,
        });

        processTinyFlags(node, newControl);

        registerRenderResult(newControl, { node, validator, asyncValidator });

        return newControl;
    }

    if (node.type !== VFormNodeType.Control || !(control instanceof FormControl)) {
        throw Error('Changing of node type is not supported');
    }

    const nextDisabled = ctx.tryDisabled(node.disabled);
    if (control.disabled !== nextDisabled) {
        if (nextDisabled) {
            control.disable();
        } else {
            control.enable();
        }
    }

    const validator = processValidators(ctx, node.validator, control);
    const asyncValidator = processAsyncValidators(ctx, node.asyncValidator, control);

    if (control.value !== node.value) {
        control.setValue(node.value);
    } else if (ctx.validatorsChanged) {
        control.updateValueAndValidity();
    }
    
    ctx.unmarkValidatorsChanged();

    processTinyFlags(node, control);

    registerRenderResult(control, { node: node, validator, asyncValidator });

    return control;
}

function processGroup(ctx: VRenderContext, node: VFormGroup, control?: FormGroup): AbstractControl {
    if (!control) {
        ctx.push(node);

        const validator = processValidators(ctx, node.validator);
        const asyncValidator = processAsyncValidators(ctx, node.asyncValidator);
        const group = new FormGroup(
            mapValues(node.children, child => processNode(ctx, child)),
            {
                validators: validator.compiled,
                asyncValidators: asyncValidator.compiled,
                updateOn: node.updateOn,
            },
        );

        // if (ctx.tryDisabled(node.disabled)) {
        //     group.disable();
        // }

        registerRenderResult(group, { node, validator, asyncValidator });

        ctx.pop();

        return group;
    }

    if (node.type !== VFormNodeType.Group || !(control instanceof FormGroup)) {
        throw Error('Changing of node type is not supported');
    }

    ctx.push(node);

    const nextDisabled = ctx.tryDisabled(node.disabled);
    if (control.disabled !== nextDisabled && !nextDisabled) {
        control.enable();
    }

    const currentChildrenNodes = mapValues(control.controls, restoreFormNode);
    const { added, removed, updated } = objectDiff(currentChildrenNodes, node.children);
    added.forEach(key => control.setControl(
        key,
        processNode(ctx, node.children[key]),
    ));
    removed.forEach(key => control.removeControl(key));
    updated.forEach(key => processNode(ctx, node.children[key], control.controls[key]));

    if (control.disabled !== nextDisabled && nextDisabled) {
        control.disable();
    }

    const validator = processValidators(ctx, node.validator, control);
    const asyncValidator = processAsyncValidators(ctx, node.asyncValidator, control);
    
    if (ctx.validatorsChanged) {
        control.updateValueAndValidity();
        ctx.unmarkValidatorsChanged();
    }

    registerRenderResult(control, { node: node, validator, asyncValidator });

    ctx.pop();

    return control;
}

function processArray(ctx: VRenderContext, node: VFormArray, control?: FormArray): AbstractControl {
    if (!control) {
        ctx.push(node);

        const validator = processValidators(ctx, node.validator);
        const asyncValidator = processAsyncValidators(ctx, node.asyncValidator);

        const array = new FormArray(
            node.children.map(child => processNode(ctx, child)),
            {
                validators: validator.compiled,
                asyncValidators: asyncValidator.compiled,
                updateOn: node.updateOn,
            },
        );

        // if (ctx.tryDisabled(node.disabled)) {
        //     array.disable();
        // }

        registerRenderResult(array, { node, validator, asyncValidator });

        ctx.pop();

        return array;
    }

    if (node.type !== VFormNodeType.Array || !(control instanceof FormArray)) {
        throw Error('Changing of node type is not supported');
    }

    ctx.push(node);

    const nextDisabled = ctx.tryDisabled(node.disabled);
    if (control.disabled !== nextDisabled && !nextDisabled) {
        control.enable();
    }

    const currentChildrenNodes = control.controls.map(restoreFormNode);
    const { added, removed, updated, indexUpdated } = arrayDiff(currentChildrenNodes, node.children, child => child.key);

    const indexToControl: { [index: number]: AbstractControl } = {};
    updated.forEach(({ previous }) => {
        indexToControl[previous] = control.controls[previous];
    });
    indexUpdated.map(({ previous }) => {
        indexToControl[previous] = control.controls[previous];
    });

    removed.reverse().forEach(index => control.removeAt(index));
    added.forEach(index => control.insert(
        index,
        processNode(ctx, node.children[index]),
    ));
    updated.forEach(({ previous, next }) => {
        const nextControl = indexToControl[previous];

        processNode(ctx, node.children[next], nextControl);

        if (control.controls[next] !== nextControl) {
            control.setControl(next, nextControl);
        }
    });
    indexUpdated.forEach(({ previous, next }) => {
        const nextControl = indexToControl[previous];

        if (control.controls[next] !== nextControl) {
            control.setControl(next, nextControl);
        }
    });

    if (control.disabled !== nextDisabled && nextDisabled) {
        control.disable();
    }

    const validator = processValidators(ctx, node.validator, control);
    const asyncValidator = processAsyncValidators(ctx, node.asyncValidator, control);
    
    if (ctx.validatorsChanged) {
        control.updateValueAndValidity();
        ctx.unmarkValidatorsChanged();
    }

    registerRenderResult(control, { node: node, validator, asyncValidator });

    ctx.pop();

    return control;
}

function processTinyFlags(node: VFormControl, control: FormControl): void {
    if (hasField(node, 'touched') && node.touched !== control.touched) {
        if (node.touched) {
            control.markAsTouched();
        } else {
            control.markAsUntouched();
        }
    }

    if (hasField(node, 'dirty') && node.dirty !== control.dirty) {
        if (node.dirty) {
            control.markAsDirty();
        } else {
            control.markAsPristine();
        }
    }
}

