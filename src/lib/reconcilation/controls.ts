import { AbstractControl, FormArray, FormControl, FormGroup } from '@angular/forms';
import { Maybe } from '../common';
import { VFormArray, VFormControl, VFormGroup, VFormNode, VFormNodeType } from '../model';
import { arrayDiff, getControlTypeName, hasField, mapValues, objectDiff } from '../utils';
import { VPathElement } from './model';
import { getLastFormNodeOrNothing, registerRenderResult } from './registry';
import { VRenderContext } from './render-context';
import { processValidators } from './validators';
import { processAsyncValidators } from './validators-async';

export function processNode(ctx: VRenderContext, name: Maybe<VPathElement>, node: VFormNode, control?: AbstractControl): AbstractControl {
    switch (node.type) {
        case VFormNodeType.Control:
            return processControl(ctx, name, node, control);
        case VFormNodeType.Group:
            return processGroup(ctx, name, node, control as FormGroup);
        case VFormNodeType.Array:
            return processArray(ctx, name, node, control as FormArray);
        default:
            throw Error(`Unsupported node type: ${ctx.pathTo(name)}`);
    }
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

    if (node.type !== VFormNodeType.Control || !(control instanceof FormControl)) {
        throw makeNodeTypeModifiedError(ctx.pathTo(name), VFormNodeType.Control, node.type, control);
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

function processGroup(ctx: VRenderContext, name: Maybe<VPathElement>, node: VFormGroup, control?: FormGroup): AbstractControl {
    if (!control) {
        ctx.push(name, node);

        const validator = processValidators(ctx, node.validator);
        const asyncValidator = processAsyncValidators(ctx, node.asyncValidator);
        const group = new FormGroup(
            mapValues(node.children, (child, key) => processNode(ctx, key, child)),
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
        throw makeNodeTypeModifiedError(ctx.pathTo(name), VFormNodeType.Group, node.type, control);
    }

    ctx.push(name, node);

    const nextDisabled = ctx.tryDisabled(node.disabled);
    if (control.disabled !== nextDisabled && !nextDisabled) {
        control.enable();
    }

    const currentChildrenNodes = mapValues(control.controls, (control, key) => getFormNode(ctx, key, control));
    const { added, removed, updated } = objectDiff(currentChildrenNodes, node.children);
    added.forEach(key => control.setControl(
        key,
        processNode(ctx, key, node.children[key]),
    ));
    removed.forEach(key => control.removeControl(key));
    updated.forEach(key => processNode(ctx, key, node.children[key], control.controls[key]));

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
            node.children.map((child, i) => processNode(ctx, i, child)),
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
        throw makeNodeTypeModifiedError(ctx.pathTo(name), VFormNodeType.Array, node.type, control);
    }

    ctx.push(name, node);

    const nextDisabled = ctx.tryDisabled(node.disabled);
    if (control.disabled !== nextDisabled && !nextDisabled) {
        control.enable();
    }

    const currentChildrenNodes = control.controls.map((control, i) => getFormNode(ctx, i, control));
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
        processNode(ctx, index, node.children[index]),
    ));
    updated.forEach(({ previous, next }) => {
        const nextControl = indexToControl[previous];

        processNode(ctx, next, node.children[next], nextControl);

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

function getFormNode(ctx: VRenderContext, name: Maybe<VPathElement>, control: AbstractControl): VFormNode {
    const node = getLastFormNodeOrNothing(control);
    if (node) {
        return node;
    }

    return restoreFormNode(ctx, name, control);
}

function restoreFormNode(ctx: VRenderContext, name: Maybe<VPathElement>, control: AbstractControl): VFormNode {
    if (control instanceof FormControl) {
        return {
            type: VFormNodeType.Control,
            updateOn: control.updateOn,
            value: control.value,
            disabled: control.disabled,
            key: ctx.options.keyGenerator(ctx.pathTo(name), control.value),
            data: {},
        } as VFormControl;
    } else if (control instanceof FormGroup) {
        return {
            type: VFormNodeType.Group,
            updateOn: control.updateOn,
            disabled: control.disabled,
            children: mapValues(control.controls, (control, key) => restoreFormNode(ctx, key, control)),
            key: ctx.options.keyGenerator(ctx.pathTo(name), control.value),
            data: {},
        } as VFormGroup;
    } else if (control instanceof FormArray) {
        return {
            type: VFormNodeType.Array,
            updateOn: control.updateOn,
            disabled: control.disabled,
            children: control.controls.map((control, i) => restoreFormNode(ctx, i, control)),
            key: ctx.options.keyGenerator(ctx.pathTo(name), control.value),
            data: {},
        } as VFormArray;
    }

    throw Error(`Unknown type of control: ${ctx.pathTo(name)}, ${control}`);
}

function makeNodeTypeModifiedError(path: VPathElement[], currentType: VFormNodeType, newType: VFormNodeType, control: AbstractControl): Error {
    throw Error(`Changing of node type is not supported: ${path},
                 currentType = ${VFormNodeType[currentType]},
                 newType = ${VFormNodeType[newType]},
                 control = ${getControlTypeName(control)}`);
}
