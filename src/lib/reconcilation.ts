import { AbstractControl, FormArray, FormControl, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { Maybe, Nullable } from './common';
import { VFormArray, VFormGroup, VFormNode, VFormNodePatch, VFormNodeType, VValidatorNode, VValidatorNodeType } from './model';
import { arrayDiff, arrayDiffUnordered, arrayify, flatMap, isAngularAtLeast, mapValues, objectDiff } from './utils';

export enum VReconcilationType {
    Update, Patch
}

export enum VValidationStrategy {
    Append,
    Replace,
}

export interface VFormFlags {
    validationStrategy: VValidationStrategy;
    updateOnChange: boolean;
}

export interface VReconcilationUpdateRequest {
    type: VReconcilationType.Update;
    flags: VFormFlags;
    node: VFormNode;
    value: any;
    control?: AbstractControl;
}

export interface VReconcilationPatchRequest {
    type: VReconcilationType.Patch;
    flags: VFormFlags;
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
    validator: ValidatorBundle;
}

const CompiledValidatorFnMarker = Symbol('compiled-validator-fn');

interface CompiledValidatorFn extends ValidatorFn {
    setValidators(validators: ValidatorFn[]): void;
    dispose(): void;
}

interface ValidatorBundle {
    children: ValidatorFn[];
    compiled?: CompiledValidatorFn;
}

interface Control12Api {
    hasValidator(validator: ValidatorFn): boolean;
    addValidators(validator: ValidatorFn): void;
    removeValidators(validator: ValidatorFn): void;
}

const canAccessListOfValidators = isAngularAtLeast(11, 0);
const canManageValidatorsIndividually = isAngularAtLeast(12, 2);

class VRenderContext {
    private _disabled: boolean[] = [];

    constructor(readonly flags: VFormFlags) {}

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
                control: processNode(
                    new VRenderContext(request.flags),
                    request.value,
                    request.node,
                    request.control,
                ),
                node: request.node,
            };
        case VReconcilationType.Patch:
            // TODO: implement
            return {
                node: getLastFormNode(request.control),
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

function restoreFormNode(control: AbstractControl): VFormNode {
    // TODO: consider the case when control is not managed by vform
    return getLastFormNode(control);
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
        const validator = processValidators(ctx, node.validator);
        const newControl = new FormControl({
            value,
            disabled: node.disabled,
        }, validator.compiled);

        registerRenderResult(newControl, { node, validator });

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

    if (control.value !== value) {
        control.setValue(value);
    }

    registerRenderResult(control, { node: node, validator });

    return control;
}

function processGroup(ctx: VRenderContext, value: any, node: VFormGroup, control?: FormGroup): AbstractControl {
    if (!control) {
        ctx.push(node);

        const validator = processValidators(ctx, node.validator);
        const group = new FormGroup(
            mapValues(
                node.children,
                (child, key) => processNode(
                    ctx,
                    getByKey(value, key),
                    child,
                ),
            ),
            validator.compiled,
        );

        if (node.disabled) {
            group.disable();
        }

        registerRenderResult(group, { node, validator });

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

    const validator = processValidators(ctx, node.validator, control);

    registerRenderResult(control, { node: node, validator });

    ctx.pop();

    return control;
}

function processArray(ctx: VRenderContext, value: any, node: VFormArray, control?: FormArray): AbstractControl {
    if (!control) {
        ctx.push(node);

        const validator = processValidators(ctx, node.validator);

        const array = new FormArray(
            node.children.map((child, i) => processNode(
                ctx,
                getByIndex(value, i),
                child,
            )),
            validator.compiled,
        );

        if (node.disabled) {
            array.disable();
        }

        registerRenderResult(array, { node, validator });

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

    const validator = processValidators(ctx, node.validator, control);

    registerRenderResult(control, { node: node, validator });

    ctx.pop();

    return control;
}

function processValidators(ctx: VRenderContext, node?: VValidatorNode, control?: AbstractControl): ValidatorBundle {    
    if (!control) {
        return createValidatorBundle(createValidators(node));
    }

    const lastNode = getLastFormNode(control).validator;
    const lastValidatorBundle = getLastValidatorBundle(control);

    if (areValidatorsChanged(lastNode, node)) {
        const validatorBundle = applyValidators({
            strategy: ctx.flags.validationStrategy,
            control,
            lastValidatorBundle,
            nextValidators: createValidators(node),
        });
        control.updateValueAndValidity();
        return validatorBundle;
    } else {
        return applyValidators({
            strategy: ctx.flags.validationStrategy,
            control,
            lastValidatorBundle,
            nextValidators: lastValidatorBundle.children,
        });
    }
}

interface ApplyValidatorsOptions {
    strategy: VValidationStrategy;
    control: AbstractControl;
    lastValidatorBundle: ValidatorBundle;
    nextValidators: ValidatorFn[];
}

function applyValidators({ strategy, control, lastValidatorBundle, nextValidators }: ApplyValidatorsOptions): ValidatorBundle {
    switch (strategy) {
        case VValidationStrategy.Append:
            if (canManageValidatorsIndividually) {
                return appendValidatorsIndividually(control as Control12Api, lastValidatorBundle, nextValidators);
            } else if (canAccessListOfValidators) {
                return appendValidatorsInBulk(control, lastValidatorBundle, nextValidators);
            } else {
                return appendValidatorsByComposing(control, lastValidatorBundle, nextValidators);
            }
        case VValidationStrategy.Replace:
            return replaceValidators(control, lastValidatorBundle, nextValidators);
        default:
            throw new Error(`Unsupported validation strategy: '${VValidationStrategy[strategy]}'`);
    }
}

function appendValidatorsIndividually(control: Control12Api, lastValidatorBundle: ValidatorBundle, nextValidators: ValidatorFn[]): ValidatorBundle {
    const { added, removed, common } = arrayDiffUnordered(lastValidatorBundle.children, nextValidators);

    const hasCompiledValidator = lastValidatorBundle.compiled && control.hasValidator(lastValidatorBundle.compiled);
    const hasValidators = added.length > 0 || common.length > 0;
    const areValidatorsModified = added.length > 0 || removed.length > 0;

    if (lastValidatorBundle.compiled && !hasCompiledValidator) {
        lastValidatorBundle.compiled.dispose();
    }

    if (hasValidators) {
        if (!hasCompiledValidator) {
            const bundle = createValidatorBundle(added.concat(common));
            control.addValidators(bundle.compiled!);
            return bundle;
        } else if (areValidatorsModified) {
            return modifyValidatorBundle(lastValidatorBundle, added.concat(common));
        }
    } else if (hasCompiledValidator) {
        lastValidatorBundle.compiled!.dispose();
        control.removeValidators(lastValidatorBundle.compiled!);
        return createValidatorBundle([]);
    }

    return lastValidatorBundle;
}

function appendValidatorsInBulk(control: AbstractControl, lastValidatorBundle: ValidatorBundle, nextValidators: ValidatorFn[]): ValidatorBundle {
    const { added, removed, common } = arrayDiffUnordered(lastValidatorBundle.children, nextValidators);

    const validators = getControlValidators(control);
    const hasCompiledValidator = lastValidatorBundle.compiled && validators.includes(lastValidatorBundle.compiled);
    const hasValidators = added.length > 0 || common.length > 0;
    const areValidatorsModified = added.length > 0 || removed.length > 0;

    if (lastValidatorBundle.compiled && !hasCompiledValidator) {
        lastValidatorBundle.compiled.dispose();
    }

    if (hasValidators) {
        if (!hasCompiledValidator) {
            const bundle = createValidatorBundle(added.concat(common));
            control.setValidators([...validators, bundle.compiled!]);
            return bundle;
        } else if (areValidatorsModified) {
            return modifyValidatorBundle(lastValidatorBundle, added.concat(common));
        }
    } else if (hasCompiledValidator) {
        lastValidatorBundle.compiled!.dispose();
        control.setValidators(validators.filter(v => v !== lastValidatorBundle.compiled));
        return createValidatorBundle([]);
    }

    return lastValidatorBundle;
}

function appendValidatorsByComposing(control: AbstractControl, lastValidatorBundle: ValidatorBundle, nextValidators: ValidatorFn[]): ValidatorBundle {
    const { added, removed, common } = arrayDiffUnordered(lastValidatorBundle.children, nextValidators);

    const hasCompiledValidator = lastValidatorBundle.compiled && lastValidatorBundle.compiled === control.validator;
    const hasValidators = added.length > 0 || common.length > 0;
    const areValidatorsModified = added.length > 0 || removed.length > 0;

    if (lastValidatorBundle.compiled && !hasCompiledValidator) {
        lastValidatorBundle.compiled.dispose();
    }

    if (hasValidators) {
        if (!hasCompiledValidator) {
            const bundle = createValidatorBundle(added.concat(common).concat(arrayify(control.validator)));
            control.validator = bundle.compiled || null;
            return bundle;
        } else if (areValidatorsModified) {
            return modifyValidatorBundle(lastValidatorBundle, added.concat(common));
        }
    } else if (hasCompiledValidator) {
        lastValidatorBundle.compiled!.dispose();
        control.validator = null;
        return createValidatorBundle([]);
    }

    return lastValidatorBundle;
}

function replaceValidators(control: AbstractControl, lastValidatorBundle: ValidatorBundle, nextValidators: ValidatorFn[]): ValidatorBundle {
    const { added, removed, common } = arrayDiffUnordered(lastValidatorBundle.children, nextValidators);

    const hasCompiledValidator = lastValidatorBundle.compiled && lastValidatorBundle.compiled === control.validator;
    const hasValidators = added.length > 0 || common.length > 0;
    const areValidatorsModified = added.length > 0 || removed.length > 0;

    if (lastValidatorBundle.compiled && !hasCompiledValidator) {
        lastValidatorBundle.compiled.dispose();
    }

    if (hasValidators) {
        if (!hasCompiledValidator) {
            const bundle = createValidatorBundle(added.concat(common));
            control.validator = bundle.compiled || null;
            return bundle;
        } else if (areValidatorsModified) {
            lastValidatorBundle.compiled!.setValidators(added.concat(common));
            return lastValidatorBundle;
        }
    } else {
        if (hasCompiledValidator) {
            lastValidatorBundle.compiled!.dispose();
        }
        control.validator = null;
        return createValidatorBundle([]);
    }

    return lastValidatorBundle;
}

function createValidatorBundle(children: ValidatorFn[]): ValidatorBundle {
    return {
        children,
        compiled: children.length ? createCompiledValidator(children) : undefined,
    };
}

function modifyValidatorBundle(bundle: ValidatorBundle, validators: ValidatorFn[]): ValidatorBundle {
    if (!bundle.compiled) {
        return createValidatorBundle(validators);
    }

    bundle.compiled.setValidators(validators);
    return bundle;
}

function createCompiledValidator(children: ValidatorFn[]): CompiledValidatorFn {
    let composed: Nullable<ValidatorFn> = Validators.compose(children);
    children = [];

    const compiled = (control: AbstractControl) => {
        if (composed) {
            return composed(control);
        }
        return null;
    };

    (compiled as any)[CompiledValidatorFnMarker] = true;

    compiled.setValidators = (validators: ValidatorFn[]) => {
        composed = Validators.compose(validators);
    };
    compiled.dispose = () => {
        composed = null;
    };

    return compiled;
}

function getControlValidators(control: AbstractControl): ValidatorFn[] {
    return arrayify((control as any)._rawValidators);
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

function createValidators(node?: VValidatorNode): ValidatorFn[] {
    return node ? arrayify(createValidator(node)) : [];
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
