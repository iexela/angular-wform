import { AbstractControl, FormArray, FormControl, FormGroup } from '@angular/forms';
import { VFormNative, VFormPlaceholder } from '..';
import { Maybe } from '../common';
import { VFormArray, VFormControl, VFormGroup, VFormNode, VFormNodeType } from '../model';
import { arrayDiff, getControlTypeName, hasField, mapValues, objectDiff, pickBy } from '../utils';
import { createAsyncValidatorBundle, createValidatorBundle } from './internal-model';
import { VPathElement } from './model';
import { getLastFormNodeOrNothing, registerRenderResult } from './registry';
import { VRenderContext } from './render-context';
import { processValidators } from './validators';
import { processAsyncValidators } from './validators-async';

export function processNode(ctx: VRenderContext, name: Maybe<VPathElement>, node: VFormNode | VFormPlaceholder, control?: AbstractControl): AbstractControl {
    if (node == null) {
        throw Error(`Node is nil: ${ctx.pathTo(name).join('.')}`);
    }

    switch (node.type) {
        case VFormNodeType.Control:
            return processControl(ctx, name, node, control);
        case VFormNodeType.Group:
            return processGroup(ctx, name, node, control as FormGroup);
        case VFormNodeType.Array:
            return processArray(ctx, name, node, control as FormArray);
        case VFormNodeType.Native:
            return processNative(ctx, name, node);
        default:
            throw Error(`Unsupported node type (${VFormNodeType[node.type] || node.type}): ${ctx.pathTo(name).join('.')}`);
    }
}

function processNative(ctx: VRenderContext, name: Maybe<VPathElement>, node: VFormNative): AbstractControl {
    const { control } = node;
    if (control == null) {
        throw Error(`Native node is rendered when it is not bound to the control: ${ctx.pathTo(name).join('.')}
                    Typically this happens when native control is used in the root.
                    But native control is not allowed to be used in the root.`);
    }

    registerRenderResult(control, {
        node,
        validator: createValidatorBundle([]),
        asyncValidator: createAsyncValidatorBundle([]),
    });

    return control;
}

function processControl(ctx: VRenderContext, name: Maybe<VPathElement>, node: VFormControl, control?: AbstractControl): AbstractControl {
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

    if (!(control instanceof FormControl)) {
        throw makeNodeTypeModifiedError(ctx.pathTo(name), VFormNodeType.Control, control);
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

function processGroup(ctx: VRenderContext,name: Maybe<VPathElement>, node: VFormGroup, control?: FormGroup): AbstractControl {
    if (!control) {
        ctx.push(name, node);

        const validator = processValidators(ctx, node.validator);
        const asyncValidator = processAsyncValidators(ctx, node.asyncValidator);
        const group = new FormGroup(
            mapValues(
                pickBy(node.children, isUsedNode),
                (child, key) => processNode(ctx, key, child as VFormNode)),
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

    if (!(control instanceof FormGroup)) {
        throw makeNodeTypeModifiedError(ctx.pathTo(name), VFormNodeType.Group, control);
    }

    ctx.push(name, node);

    const nextDisabled = ctx.tryDisabled(node.disabled);
    if (control.disabled !== nextDisabled && !nextDisabled) {
        control.enable();
    }

    const currentChildrenNodes = mapValues(
        control.controls,
        (control, key) => getOrRestoreFormNodeWithKey(ctx, key, control));
    const { added, removed, updated } = objectDiff(currentChildrenNodes, pickBy(node.children, isUsedNode));
    added.forEach(key => control.setControl(
        key,
        processNode(ctx, key, node.children[key] as VFormNode),
    ));
    removed.forEach(key => control.removeControl(key));
    updated.forEach(key => processNode(ctx, key, node.children[key] as VFormNode, control.controls[key]));

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

function processArray(ctx: VRenderContext, name: Maybe<VPathElement>, node: VFormArray, control?: FormArray): AbstractControl {
    if (!control) {
        ctx.push(name, node);

        const validator = processValidators(ctx, node.validator);
        const asyncValidator = processAsyncValidators(ctx, node.asyncValidator);

        const array = new FormArray(
            node.children.filter(isUsedNode).map((child, i) => processNode(ctx, i, child)),
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

    if (!(control instanceof FormArray)) {
        throw makeNodeTypeModifiedError(ctx.pathTo(name), VFormNodeType.Array, control);
    }

    ctx.push(name, node);

    const nextDisabled = ctx.tryDisabled(node.disabled);
    if (control.disabled !== nextDisabled && !nextDisabled) {
        control.enable();
    }

    const currentChildrenNodes = control.controls
        .map((control, i) => getOrRestoreFormNodeWithKey(ctx, i, control));
    const nextChildrenNodes = node.children.filter(isUsedNode);
    const { added, removed, updated, indexUpdated } = arrayDiff(
        currentChildrenNodes,
        nextChildrenNodes,
        // ?. is intentional here in order to allow nulls
        // null error is catched later in processNode
        child => child?.key,
        ctx.pathTo());

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
        processNode(ctx, index, nextChildrenNodes[index] as VFormNode),
    ));
    updated.forEach(({ previous, next }) => {
        const nextControl = indexToControl[previous];

        processNode(ctx, next, nextChildrenNodes[next] as VFormNode, nextControl);

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

interface VKeyOnlyFormNode {
    key: any;
}

function getOrRestoreFormNodeWithKey(ctx: VRenderContext, name: Maybe<VPathElement>, control: AbstractControl): VFormNode | VKeyOnlyFormNode {
    const node = getLastFormNodeOrNothing(control);
    if (node) {
        return node;
    }

    if (ctx.options.strict) {
        throw Error(`Unexpected control found: ${ctx.pathTo(name).join('.')}
                    Since vform works in strict mode, unmanaged controls are not allowed.
                    You need to do one of the following
                    * Get rid of adding unmanaged controls
                    * If you really need to add controls manually, try to use vNative/vPortal
                    * Switch off strict mode`);
    }

    return {
        key: ctx.options.keyGenerator(ctx.pathTo(name), control.value),
    };
}

function makeNodeTypeModifiedError(path: VPathElement[], requestedType: VFormNodeType, control: AbstractControl): Error {
    throw Error(`Changing of form control type is not supported: ${path.join('.')},
                 requestedType = ${VFormNodeType[requestedType]},
                 control = ${getControlTypeName(control)}`);
}

function isUsedNode(node: VFormNode | VFormPlaceholder): node is VFormNode {
    if (node == null) {
        // It is intentional, null error is catched later in processNode
        return true;
    }

    if (node.type === VFormNodeType.Placeholder) {
        return false;
    }

    if (node.type === VFormNodeType.Native && !node.control) {
        return false;
    }

    return true;
}
