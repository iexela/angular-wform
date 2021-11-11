import { AbstractControl, FormArray, FormGroup } from '@angular/forms';
import { ProcedureFn } from './common';
import { VFormNodeFactory, VFormNode, VFormPatcher as VFormNodePatcher } from './model';
import { reconcile, VFormFlags, VReconcilationRequest, VReconcilationType } from './reconcilation';
import { calculateValue } from './utils';

export class VForm<T> {
    private _control: AbstractControl;
    private _factory: VFormNodeFactory<T>;
    private flags: VFormFlags;
    private _reconcilationInProgress = false;

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

    constructor(factory: VFormNodeFactory<T>, flags: VFormFlags, value: T) {
        this.flags = flags;

        this._control = reconcile({
            flags,
            node: factory(value),
        });

        this._factory = factory;

        if (flags.updateOnChange) {
            this._control.valueChanges.subscribe(() => {
                if (!this._reconcilationInProgress) {
                    this.update();
                }
            });
        }
    }

    setValue(value: T): void {
        this._reconcile({
            flags: this.flags,
            node: this._factory(value),
            control: this._control,
        });
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

        this._reconcile({
            flags: this.flags,
            node: this._factory(value),
            control: this._control,
        });
    }

    patch(patcher: VFormNodePatcher): void {
        this._reconcile({
            flags: this.flags,
            node: patcher(this._control),
            control: this._control,
        });
    }

    private _reconcile(request: VReconcilationRequest): void {
        this._reconcilationInProgress = true;
        try {
            this._control = reconcile(request);
        } finally {
            this._reconcilationInProgress = false;
        }
    }
}
