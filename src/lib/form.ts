import { AbstractControl, FormArray, FormGroup } from '@angular/forms';
import { Maybe, ProcedureFn } from './common';
import { VFormNodeFactory, VFormNode, VFormPatcher as VFormNodePatcher } from './model';
import { reconcile, VReconcilationType } from './reconcilation';
import { calculateValue } from './utils';

export class VForm<T> {
    private _node: VFormNode;
    private _control: AbstractControl;
    private _factory: VFormNodeFactory<T>;

    get control(): AbstractControl {
        return this._control;
    }

    get value(): T {
        return this._control.value;
    }

    get rawValue(): T {
        return calculateValue(this._control);
    }

    get valid(): boolean {
        return this._control.valid;
    }

    get invalid(): boolean {
        return this._control.invalid;
    }

    constructor(factory: VFormNodeFactory<T>, value: T) {
        const { node, control } = reconcile({
            type: VReconcilationType.Build,
            node: factory(value),
            value
        });

        this._factory = factory;
        this._node = node;
        this._control = control;
    }

    setValue(value: T): void {
        const { node, control } = reconcile({
            type: VReconcilationType.Update,
            node: this._node,
            nextNode: this._factory(value),
            value,
            control: this._control,
        });
        this._node = node;
        this._control = control;
    }

    resetValue(value: T): void {
        this.setValue(value);
    }

    markAllAsPristine(): void {
        this.forEach(control => control.markAsPristine({ onlySelf: true }));
    }

    markAllAsDirty(): void {
        this.forEach(control => control.markAsDirty({ onlySelf: true }));
    }

    markAllAsTouched(): void {
        this._control.markAllAsTouched();
    }

    markAllAsUntouched(): void {
        this.forEach(control => control.markAsUntouched({ onlySelf: true }));
    }

    forEach(cb: ProcedureFn<AbstractControl>): void {

        function onEach(control: AbstractControl): void {
            if (control instanceof FormGroup) {
                cb(control);
                Object.keys(control.controls || {}).forEach(key => onEach(control.controls[key]));
            } else if (control instanceof FormArray) {
                cb(control);
                (control.controls || []).forEach(onEach);
            } else {
                cb(control);
            }
        }
    
        onEach(this._control);
    }

    getControl(path: string): AbstractControl {
        const found = this._control.get(path);

        if (found == null) {
            throw new Error(`Control was not found: ${path}`);
        }

        return found;
    }

    hasControl(path: string): boolean {
        return this._control.get(path) != null;
    }

    update(): void {
        const value = this.rawValue;

        const { node, control } = reconcile({
            type: VReconcilationType.Update,
            node: this._node,
            nextNode: this._factory(value),
            value,
            control: this._control,
        });
        this._node = node;
        this._control = control;
    }

    patch(patcher: VFormNodePatcher<T>): void {
        const value = this.rawValue;

        const { node, control } = reconcile({
            type: VReconcilationType.Patch,
            node: this._node,
            patchNode: patcher(value, this._node),
            value,
            control: this._control,
        });
        this._node = node;
        this._control = control;
    }
}
