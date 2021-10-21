import { AbstractControl, FormArray, FormControl, FormGroup, ValidatorFn } from '@angular/forms';
import { VFormArray, VFormGroup, VFormNode, VFormNodePatch, VFormNodeType, VValidatorNode, VValidatorNodeType } from './model';
import { arrayDiff, arrayify, flatMap, mapValues, objectDiff } from './utils';

export enum VReconcilationType {
    Update, Patch
}

export interface VReconcilationUpdateRequest {
    type: VReconcilationType.Update;
    node: VFormNode;
    value: any;
    control?: AbstractControl;
}

export interface VReconcilationPatchRequest {
    type: VReconcilationType.Patch;
    node: VFormNodePatch;
    value: any;
    control: AbstractControl;
}

export interface VReconcilationResponse {
    control: AbstractControl;
    node: VFormNode;
}

export type VReconcilationRequest = VReconcilationUpdateRequest | VReconcilationPatchRequest;

interface VRenderResult {
    node: VFormNode;
    validators: ValidatorFn | ValidatorFn[] | null;
}

class VRenderContext {
    private _disabled: boolean[] = [];

    tryDisabled(disabled: boolean) {
        const disabledTop = this._disabled.length === 0 ? false : this._disabled[this._disabled.length - 1];

        return disabledTop ? true : disabled;
    }

    push(node: VFormGroup | VFormArray): void {
        this._disabled.push(this.tryDisabled(node.disabled));
    }

    pop(): void {
        this._disabled.pop();
    }
}

export function reconcile(request: VReconcilationRequest): VReconcilationResponse {
    switch (request.type) {
        case VReconcilationType.Update:
            return {
                control: processNode(new VRenderContext(), request.value, request.node, request.control),
                node: request.node,
            };
        case VReconcilationType.Patch:
            // TODO: implement
            return {
                node: getFormNode(request.control),
                control: request.control,
            };
        default:
            throw Error(`Unsupported reconcilation operation`);
    }
}

const results = new WeakMap<AbstractControl, VRenderResult>();

function registerRenderResult(control: AbstractControl, result: VRenderResult): void {
    results.set(control, result);
}

export function getFormNode(control: AbstractControl): VFormNode {
    const result = results.get(control);

    if (!result) {
        throw new Error('FormNode has been ever rendered');
    }

    return result.node;
}

function restoreFormNode(control: AbstractControl): VFormNode {
    // TODO: consider the case when control is not managed by vform
    return getFormNode(control);
}

function processNode(ctx: VRenderContext, value: any, node: VFormNode, control?: AbstractControl): AbstractControl {
    // TODO: add node.asyncValidators handling
    switch (node.type) {
        case VFormNodeType.Control:
            return processControl(ctx, value, node, control);
        case VFormNodeType.Group:
            return processGroup(ctx, value, node as VFormGroup, control as FormGroup);
        case VFormNodeType.Array:
            return processArray(ctx, value, node as VFormArray, control as FormArray);
        default:
            throw Error(`Unsupported node type`);
    }
}

function processControl(ctx: VRenderContext, value: any, node: VFormNode, control?: AbstractControl): AbstractControl {
    if (!node || !control) {
        const validators = processValidators(node.validator);
        const newControl = new FormControl({
            value,
            disabled: node.disabled,
        }, validators);

        registerRenderResult(newControl, { node, validators });

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

    const validators = processValidators(node.validator, control);

    if (control.value !== value) {
        control.setValue(value);
    }

    registerRenderResult(control, { node: node, validators });

    return control;
}

function processGroup(ctx: VRenderContext, value: any, node: VFormGroup, control?: FormGroup): AbstractControl {
    if (!control) {
        ctx.push(node);

        const validators = processValidators(node.validator);
        const group = new FormGroup(
            mapValues(
                node.children,
                (child, key) => processNode(
                    ctx,
                    getByKey(value, key),
                    child,
                ),
            ),
            validators,
        );

        if (node.disabled) {
            group.disable();
        }

        registerRenderResult(group, { node, validators });

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
        processNode(
            ctx,
            getByKey(value, key),
            node.children[key],
        ),
    ));
    removed.forEach(key => control.removeControl(key));
    updated.forEach(key => processNode(
        ctx,
        getByKey(value, key),
        node.children[key],
        control.controls[key],
    ));

    if (control.disabled !== nextDisabled && nextDisabled) {
        control.disable();
    }

    const validators = processValidators(node.validator, control);

    registerRenderResult(control, { node: node, validators });

    ctx.pop();

    return control;
}

function processArray(ctx: VRenderContext, value: any, node: VFormArray, control?: FormArray): AbstractControl {
    if (!control) {
        ctx.push(node);

        const validators = processValidators(node.validator);

        const array = new FormArray(
            node.children.map((child, i) => processNode(
                ctx,
                getByIndex(value, i),
                child,
            )),
            validators,
        );

        if (node.disabled) {
            array.disable();
        }

        registerRenderResult(array, { node, validators });

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
        processNode(
            ctx,
            getByIndex(value, index),
            node.children[index],
        ),
    ));
    updated.forEach(({ previous, next }) => {
        const nextControl = indexToControl[previous];

        processNode(
            ctx,
            getByIndex(value, next),
            node.children[next],
            nextControl,
        );

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

    const validators = processValidators(node.validator, control);

    registerRenderResult(control, { node: node, validators });

    ctx.pop();

    return control;
}

function processValidators(node?: VValidatorNode, control?: AbstractControl): ValidatorFn | ValidatorFn[] | null {    
    if (!control) {
        return createFormValidator(node);
    }

    const lastNode = getFormNode(control).validator;

    let validators: ValidatorFn | ValidatorFn[] | null = null;

    if (areValidatorsChanged(lastNode, node)) {
        validators = createFormValidator(node);
        control.setValidators(validators);
        control.updateValueAndValidity();
    }

    return validators;
}

function areValidatorsChanged(a?: VValidatorNode, b?: VValidatorNode): boolean {
    if ((a == null) !== (b == null)) {
        return true;
    }

    if (a == null || b == null) {
        return false;
    }

    return !isValidatorEqual(a, b);
}

function isValidatorEqual(a: VValidatorNode, b: VValidatorNode): boolean {
    if (a.type === VValidatorNodeType.Simple && b.type === VValidatorNodeType.Simple) {
        if (a.validator === b.validator) {
            return true;
        }

        if ((a.locals == null) !== (b.locals == null)
            || a.locals == null || b.locals == null
            || a.locals.length !== b.locals.length) {
            return false;
        }

        return a.locals.every((l, i) => l === b.locals![i]);
    }

    if (a.type === VValidatorNodeType.Factory && b.type === VValidatorNodeType.Factory) {
        if (a.factory !== b.factory || a.args.length !== b.args.length) {
            return false;
        }

        return a.args.every((arg, i) => arg === b.args[i]);
    }

    if (a.type === VValidatorNodeType.Compound && b.type === VValidatorNodeType.Compound) {
        if (a.mixer !== b.mixer || a.children.length !== b.children.length) {
            return false;
        }

        return a.children.every((v, i) => isValidatorEqual(v, b.children[i]));
    }

    return false;
}

function createFormValidator(node?: VValidatorNode): ValidatorFn | ValidatorFn[] | null {
    return node ? arrayify(createValidator(node)) : null;
}

function createValidator(node: VValidatorNode): ValidatorFn | ValidatorFn[] {
    if (node.type === VValidatorNodeType.Simple) {
        return node.validator;
    } else if (node.type === VValidatorNodeType.Factory) {
        return node.factory(...node.args);
    } else {
        return node.mixer(flatMap(node.children, child => arrayify(createValidator(child))));
    }
}

function getByKey(value: any, key: string): any {
    return value != null ? value[key] : null;
}

function getByIndex(value: any, index: number): any {
    return value != null ? value[index] : null;
}
