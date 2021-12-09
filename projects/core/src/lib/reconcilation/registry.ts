import { AbstractControl } from '@angular/forms';
import { WThisFormNode } from '../model';
import { Maybe } from '../common';
import { AsyncValidatorBundle, createAsyncValidatorBundle, createValidatorBundle, ValidatorBundle } from './internal-model';
import { BehaviorSubject, map, Observable, Subject } from 'rxjs';

export interface VRenderResult {
    node: WThisFormNode;
    validator: ValidatorBundle;
    asyncValidator: AsyncValidatorBundle;
}

export interface VRenderResultInternal extends VRenderResult{
    nodeSubject?: Subject<WThisFormNode>;
}

export interface VRoot {
    disabled: boolean;
}

const results = new WeakMap<AbstractControl, VRenderResultInternal>();

const roots = new WeakMap<AbstractControl, VRoot>();

export function registerRenderResult(control: AbstractControl, result: VRenderResult): void {
    const previousResult = results.get(control);
    results.set(control, { ...previousResult, ...result });
    if (previousResult?.nodeSubject) {
        previousResult.nodeSubject.next(result.node);
    }
}

export function getLastFormNodeOrNothing(control: AbstractControl): Maybe<WThisFormNode> {
    const result = results.get(control);

    if (!result) {
        return;
    }

    return result.node;
}

export function getLastFormNode(control: AbstractControl): WThisFormNode {
    return getLastRenderedResult(control).node;
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

export function getData(control: AbstractControl): Record<string, any> {
    return getLastFormNode(control).data;
}

export function dataChanges(control: AbstractControl): Observable<Record<string, any>> {
    return ensureNodeSubject(control).pipe(map(node => node.data));
}

function getLastRenderedResult(control: AbstractControl): VRenderResultInternal {
    const result = results.get(control);

    if (!result) {
        throw new Error('FormNode has been never rendered');
    }

    return result;
}

function ensureNodeSubject(control: AbstractControl): Subject<WThisFormNode> {
    const result = getLastRenderedResult(control);
    if (result.nodeSubject) {
        return result.nodeSubject;
    }
    const nodeSubject = new Subject<WThisFormNode>();
    registerRenderResult(control, { ...result, nodeSubject } as VRenderResultInternal);
    return nodeSubject;
}
