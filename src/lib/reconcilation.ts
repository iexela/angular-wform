import { AbstractControl, FormArray, FormControl, FormGroup, ValidatorFn } from '@angular/forms';
import { VFormArray, VFormGroup, VFormNode, VFormNodePatch, VFormNodeType, VValidatorNode, VValidatorNodeType } from './model';
import { arrayDiff, arrayify, flatMap, mapValues, objectDiff } from './utils';

export enum VReconcilationType {
    Build, Update, Patch
}

export interface VReconcilationBuildRequest {
    type: VReconcilationType.Build;
    node: VFormNode;
    value: any;
}

export interface VReconcilationUpdateRequest {
    type: VReconcilationType.Update;
    node: VFormNode;
    nextNode: VFormNode;
    value: any;
    control: AbstractControl;
}

export interface VReconcilationPatchRequest {
    type: VReconcilationType.Patch;
    node: VFormNode;
    patchNode: VFormNodePatch;
    value: any;
    control: AbstractControl;
}

export interface VReconcilationResponse {
    control: AbstractControl;
    node: VFormNode;
}

export type VReconcilationRequest = VReconcilationBuildRequest | VReconcilationUpdateRequest | VReconcilationPatchRequest;

export function reconcile(request: VReconcilationRequest): VReconcilationResponse {
    switch (request.type) {
        case VReconcilationType.Build:
            return {
                control: processNode(request.value, request.node),
                node: request.node,
            };
        case VReconcilationType.Update:
            return {
                control: processNode(request.value, request.node, request.nextNode, request.control),
                node: request.nextNode,
            };
        case VReconcilationType.Patch:
            // TODO: implement
            return {
                node: request.node,
                control: request.control,
            };
        default:
            throw Error(`Unsupported reconcilation operation`);
    }
}

const nodes = new WeakMap<AbstractControl, VFormNode>();

function registerFormNode(control: AbstractControl, node: VFormNode): void {
    nodes.set(control, node);
}

export function getFormNode(control: AbstractControl): VFormNode {
    const node = nodes.get(control);

    if (!node) {
        throw new Error('FormNode was not found for control');
    }

    return node;
}

function processNode(value: any, node: VFormNode, nextNode?: VFormNode, control?: AbstractControl): AbstractControl {
    // TODO: make reconcilation more robust by relying on effective control attributes rather than node attributes
    // TODO: add node.asyncValidators handling
    switch (node.type) {
        case VFormNodeType.Control:
            return processControl(value, node, nextNode, control);
        case VFormNodeType.Group:
            return processGroup(value, node as VFormGroup, nextNode as VFormGroup, control as FormGroup);
        case VFormNodeType.Array:
            return processArray(value, node as VFormArray, nextNode as VFormArray, control as FormArray);
        default:
            throw Error(`Unsupported node type`);
    }
}

function processControl(value: any, node: VFormNode, nextNode?: VFormNode, control?: AbstractControl): AbstractControl {
    if (!nextNode || !control) {
        const newControl = new FormControl({
            value,
            disabled: node.disabled,
        }, createFormValidator(node.validator));

        registerFormNode(newControl, node);

        return newControl;
    }

    if (nextNode.type !== VFormNodeType.Control || !(control instanceof FormControl)) {
        throw Error('Changing of node type is not supported');
    }

    if (node.disabled !== nextNode.disabled) {
        if (nextNode.disabled) {
            control.disable();
        } else {
            control.enable();
        }
    }

    if (areValidatorsChanged(node.validator, nextNode.validator)) {
        control.setValidators(createFormValidator(nextNode.validator));
        control.updateValueAndValidity();
    }

    if (control.value !== value) {
        control.setValue(value);
    }

    registerFormNode(control, nextNode);

    return control;
}


function processGroup(value: any, node: VFormGroup, nextNode?: VFormGroup, control?: FormGroup): AbstractControl {
    if (!nextNode || !control) {
        const group = new FormGroup(
            mapValues(
                node.children,
                (child, key) => processNode(
                    getByKey(value, key),
                    child,
                ),
            ),
            createFormValidator(node.validator),
        );

        if (node.disabled) {
            group.disable();
        }

        registerFormNode(group, node);

        return group;
    }

    if (nextNode.type !== VFormNodeType.Group || !(control instanceof FormGroup)) {
        throw Error('Changing of node type is not supported');
    }

    if (node.disabled !== nextNode.disabled && !nextNode.disabled) {
        control.enable();
    }

    const { added, removed, updated } = objectDiff(node.children, nextNode.children);
    added.forEach(key => control.setControl(
        key,
        processNode(
            getByKey(value, key),
            nextNode.children[key],
        ),
    ));
    removed.forEach(key => control.removeControl(key));
    updated.forEach(key => processNode(
        getByKey(value, key),
        node.children[key],
        nextNode.children[key],
        control.controls[key],
    ));

    if (node.disabled !== nextNode.disabled && nextNode.disabled) {
        control.disable();
    }

    if (areValidatorsChanged(node.validator, nextNode.validator)) {
        control.setValidators(createFormValidator(nextNode.validator));
        control.updateValueAndValidity();
    }

    registerFormNode(control, nextNode);

    return control;
}

function processArray(value: any, node: VFormArray, nextNode?: VFormArray, control?: FormArray): AbstractControl {
    if (!nextNode || !control) {
        const array = new FormArray(
            node.children.map((child, i) => processNode(
                getByIndex(value, i),
                child,
            )),
            createFormValidator(node.validator),
        );

        if (node.disabled) {
            array.disable();
        }

        registerFormNode(array, node);

        return array;
    }

    if (nextNode.type !== VFormNodeType.Array || !(control instanceof FormArray)) {
        throw Error('Changing of node type is not supported');
    }

    if (node.disabled !== nextNode.disabled && !nextNode.disabled) {
        control.enable();
    }

    const { added, removed, updated, indexUpdated } = arrayDiff(node.children, nextNode.children, child => child.key);

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
            getByIndex(value, index),
            nextNode.children[index],
        ),
    ));
    updated.forEach(({ previous, next }) => {
        const nextControl = indexToControl[previous];

        processNode(
            getByIndex(value, next),
            node.children[previous],
            nextNode.children[next],
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

    if (node.disabled !== nextNode.disabled && nextNode.disabled) {
        control.disable();
    }

    if (areValidatorsChanged(node.validator, nextNode.validator)) {
        control.setValidators(createFormValidator(nextNode.validator));
        control.updateValueAndValidity();
    }

    registerFormNode(control, nextNode);

    return control;
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
