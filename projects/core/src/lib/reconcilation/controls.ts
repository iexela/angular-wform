import { AbstractControl, FormArray, FormControl, FormGroup } from '@angular/forms';
import { getLastFormNode } from '.';
import { WFormNative, WFormPlaceholder, WFormPortal, WPathElement, WThisFormNode } from '../model';
import { Maybe } from '../common';
import { WFormArray, WFormControl, WFormGroup, WFormNode, WFormNodeType } from '../model';
import { arrayDiff, getControlTypeName, hasField, isControlValue, mapValues, objectDiff, pickBy } from '../utils';
import { getLastFormNodeOrNothing, registerRenderResult, registerRoot } from './registry';
import { WRenderContext } from './render-context';
import { processValidators } from './validators';
import { processAsyncValidators } from './validators-async';

export function processNode(ctx: WRenderContext, name: Maybe<WPathElement>, node: WFormNode | WFormPlaceholder, value: any, control?: AbstractControl): AbstractControl {
    if (node == null) {
        throw Error(`Node is nil: ${ctx.pathTo(name).join('.')}`);
    }

    switch (node.type) {
        case WFormNodeType.Control:
            return processControl(ctx, name, node, value, control);
        case WFormNodeType.Group:
            return processGroup(ctx, name, node, value, control as FormGroup);
        case WFormNodeType.Array:
            return processArray(ctx, name, node, value, control as FormArray);
        case WFormNodeType.Native:
            return processNative(ctx, name, node, value);
        case WFormNodeType.Portal:
            return processPortal(ctx, name, node, value, control);
        default:
            throw Error(`Unsupported node type (${WFormNodeType[node.type] || node.type}): ${ctx.pathTo(name).join('.')}`);
    }
}

function processPortal(ctx: WRenderContext, name: Maybe<WPathElement>, node: WFormPortal, value: any, control?: AbstractControl): AbstractControl {
    const form = ctx.portalHost.getForm(node.name);
    if (form == null) {
        throw Error(`Portal node is rendered when it is not bound to the wform: ${ctx.pathTo(name).join('.')}
                    Typically this happens when portal is used in the root of the form.
                    But portal is not allowed to use in the root of the form.`);
    }

    registerRoot(form.control, { disabled: ctx.tryDisabled(false) });

    if (form.control === control) {
        // Do not update value on connect
        form.setValue(value);
    } else {
        form.update();
    }

    return form.control;
}

function processNative(ctx: WRenderContext, name: Maybe<WPathElement>, node: WFormNative<any>, value: any): AbstractControl {
    value = node.hasOwnProperty('value') ? node.value : value;
    
    const { control } = node;
    if (control == null) {
        throw Error(`Native node is rendered when it is not bound to the control: ${ctx.pathTo(name).join('.')}
                    Typically this happens when native control is used in the root of the form.
                    But native control is not allowed to use in the root of the form.`);
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

    if (!isControlValue(control, value)) {
        control.setValue(value);
    } else if (ctx.validatorsChanged) {
        control.updateValueAndValidity();
    }
    
    ctx.unmarkValidatorsChanged();

    processTinyFlags(node, control);

    registerRenderResult(control, { node: node, validator, asyncValidator });

    return control;
}

function processControl(ctx: WRenderContext, name: Maybe<WPathElement>, node: WFormControl<any>, value: any, control?: AbstractControl): AbstractControl {
    value = node.hasOwnProperty('value') ? node.value : value;

    if (!node || !control) {
        const validator = processValidators(ctx, node.validator);
        const asyncValidator = processAsyncValidators(ctx, node.asyncValidator);
        const newControl = new FormControl({
            value,
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
        throw makeNodeTypeModifiedError(ctx.pathTo(name), WFormNodeType.Control, control);
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

    if (control.value !== value) {
        control.setValue(value);
    } else if (ctx.validatorsChanged) {
        control.updateValueAndValidity();
    }
    
    ctx.unmarkValidatorsChanged();

    processTinyFlags(node, control);

    registerRenderResult(control, { node: node, validator, asyncValidator });

    return control;
}

function processGroup(ctx: WRenderContext,name: Maybe<WPathElement>, node: WFormGroup, value: any, control?: FormGroup): AbstractControl {
    if (!control) {
        ctx.push(name, node);

        const validator = processValidators(ctx, node.validator);
        const asyncValidator = processAsyncValidators(ctx, node.asyncValidator);
        const group = new FormGroup(
            mapValues(
                pickBy(node.children, ctx.isUsedNode),
                (child, key) => processNode(ctx, key, child as WFormNode, value?.[key])),
            {
                validators: validator.compiled,
                asyncValidators: asyncValidator.compiled,
                updateOn: node.updateOn,
            },
        );

        // if (ctx.tryDisabled(node.disabled)) {
        //     group.disable();
        // }

        processTinyFlags(node, group);

        registerRenderResult(group, { node, validator, asyncValidator });

        ctx.pop();

        return group;
    }

    if (!(control instanceof FormGroup)) {
        throw makeNodeTypeModifiedError(ctx.pathTo(name), WFormNodeType.Group, control);
    }

    ctx.push(name, node);

    // const nextDisabled = ctx.tryDisabled(node.disabled);
    // if (control.disabled !== nextDisabled && !nextDisabled) {
    //     control.enable();
    // }

    const currentChildrenNodes = mapValues(
        control.controls,
        (control, key) => getOrRestoreFormNodeWithKey(ctx, key, control));
    const { added, removed, updated } = objectDiff(currentChildrenNodes, pickBy(node.children, ctx.isUsedNode));
    added.forEach(key => control.setControl(
        key,
        processNode(ctx, key, node.children[key] as WFormNode, value?.[key]),
    ));
    removed.forEach(key => control.removeControl(key));
    updated.forEach(key => processNode(ctx, key, node.children[key] as WFormNode, value?.[key], control.controls[key]));

    // if (control.disabled !== nextDisabled && nextDisabled) {
    //     control.disable();
    // }

    const validator = processValidators(ctx, node.validator, control);
    const asyncValidator = processAsyncValidators(ctx, node.asyncValidator, control);
    
    if (ctx.validatorsChanged) {
        control.updateValueAndValidity();
        ctx.unmarkValidatorsChanged();
    }

    processTinyFlags(node, control);

    registerRenderResult(control, { node: node, validator, asyncValidator });

    ctx.pop();

    return control;
}

function processArray(ctx: WRenderContext, name: Maybe<WPathElement>, node: WFormArray, value: any, control?: FormArray): AbstractControl {
    if (!control) {
        ctx.push(name, node);

        const validator = processValidators(ctx, node.validator);
        const asyncValidator = processAsyncValidators(ctx, node.asyncValidator);

        const array = new FormArray(
            node.children.filter(ctx.isUsedNode).map((child, i) => processNode(ctx, i, child, value?.[i])),
            {
                validators: validator.compiled,
                asyncValidators: asyncValidator.compiled,
                updateOn: node.updateOn,
            },
        );

        // if (ctx.tryDisabled(node.disabled)) {
        //     array.disable();
        // }

        processTinyFlags(node, array);

        registerRenderResult(array, { node, validator, asyncValidator });

        ctx.pop();

        return array;
    }

    if (!(control instanceof FormArray)) {
        throw makeNodeTypeModifiedError(ctx.pathTo(name), WFormNodeType.Array, control);
    }

    ctx.push(name, node);

    // const nextDisabled = ctx.tryDisabled(node.disabled);
    // if (control.disabled !== nextDisabled && !nextDisabled) {
    //     control.enable();
    // }

    const currentChildrenNodes = control.controls
        .map((control, i) => getOrRestoreFormNodeWithKey(ctx, i, control));
    const nextChildrenNodes = node.children.filter(ctx.isUsedNode);
    const { added, removed, updated, indexUpdated } = arrayDiff(
        currentChildrenNodes,
        nextChildrenNodes,
        child => {
            // It is intentional here in order to allow nulls.
            // null error is catched later in processNode.
            if (!child) {
                return;
            }

            if (isPortalNode(child)) {
                return getLastFormNode(ctx.portalHost.getForm(child.name).control).key;
            }
            return child.key;
        },
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
        processNode(ctx, index, nextChildrenNodes[index] as WFormNode, value?.[index]),
    ));
    updated.forEach(({ previous, next }) => {
        const nextControl = indexToControl[previous];

        processNode(ctx, next, nextChildrenNodes[next] as WFormNode, value?.[next], nextControl);

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

    // if (control.disabled !== nextDisabled && nextDisabled) {
    //     control.disable();
    // }

    const validator = processValidators(ctx, node.validator, control);
    const asyncValidator = processAsyncValidators(ctx, node.asyncValidator, control);
    
    if (ctx.validatorsChanged) {
        control.updateValueAndValidity();
        ctx.unmarkValidatorsChanged();
    }

    processTinyFlags(node, control);

    registerRenderResult(control, { node: node, validator, asyncValidator });

    ctx.pop();

    return control;
}

function processTinyFlags(node: WThisFormNode, control: AbstractControl): void {
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

function getOrRestoreFormNodeWithKey(ctx: WRenderContext, name: Maybe<WPathElement>, control: AbstractControl): WFormNode | VKeyOnlyFormNode {
    const node = getLastFormNodeOrNothing(control);
    if (node) {
        return node;
    }

    if (ctx.options.strict) {
        throw Error(`Unexpected control found: ${ctx.pathTo(name).join('.')}
                    Since wform works in strict mode, unmanaged controls are not allowed.
                    You need to do one of the following
                    * Get rid of adding unmanaged controls
                    * If you really need to add controls manually, try to use vNative/vPortal
                    * Switch off strict mode`);
    }

    return {
        key: ctx.options.keyGenerator(ctx.pathTo(name), control.value),
    };
}

function makeNodeTypeModifiedError(path: WPathElement[], requestedType: WFormNodeType, control: AbstractControl): Error {
    throw Error(`Changing of form control type is not supported: ${path.join('.')},
                 requestedType = ${WFormNodeType[requestedType]},
                 control = ${getControlTypeName(control)}`);
}

function isPortalNode(node: WFormNode | VKeyOnlyFormNode): node is WFormPortal {
    return (node as WFormNode).type === WFormNodeType.Portal;
}
