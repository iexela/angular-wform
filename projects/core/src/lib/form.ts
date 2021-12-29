import { AbstractControl, FormArray, FormGroup } from '@angular/forms';
import { Observable, OperatorFunction } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { ProcedureFn, TransformFn } from './common';
import { WFormNode, WFormNodeFactory } from './model';
import { WPortal } from './portal-host';
import { WFormReconcilationOptions } from './reconcilation';
import { WFormRenderer } from './renderer';
import { calculateValue, isFunction } from './utils';

export interface WFormOptions extends WFormReconcilationOptions {
    updateOnChange: boolean;
}

export class WForm<T> implements WPortal<T> {
    private _renderer: WFormRenderer<T>;
    private _factory: WFormNodeFactory<T, WFormNode>;

    readonly valueChanges: Observable<T>;
    readonly rawValueChanges: Observable<T>;

    get control(): AbstractControl {
        const { control } = this._renderer;
        if (!control) {
            throw new Error('Root control is not rendered yet');
        }
        return control;
    }

    get group(): FormGroup {
        const control = this.control;

        if (!(control instanceof FormGroup)) {
            throw new Error('Root element is not FormGroup');
        }

        return control;
    }

    get array(): FormArray {
        const control = this.control;

        if (!(control instanceof FormArray)) {
            throw new Error('Root element is not FormArray');
        }

        return control;
    }

    get value(): T {
        return this.control.value;
    }

    get rawValue(): T {
        return calculateValue(this.control);
    }

    get valid(): boolean {
        return this.control.valid;
    }

    get invalid(): boolean {
        return this.control.invalid;
    }

    constructor(factory: WFormNodeFactory<T, WFormNode>, options: WFormOptions, value: T, base?: AbstractControl) {
        const renderer = new WFormRenderer(options);

        this._renderer = renderer;

        if (base) {
            renderer.attach(base, factory(value), value);
        } else {
            renderer.render(factory(value), value);
        }

        const nativeValueChanges = renderer.controlObservable
            .pipe(switchMap(control => control.valueChanges));

        this.valueChanges = nativeValueChanges.pipe(renderer.afterReconcilation());
        this.rawValueChanges = this.valueChanges.pipe(map(() => this.rawValue));

        this._factory = factory;

        if (options.updateOnChange) {
            nativeValueChanges.subscribe(() => {
                if (!renderer.reconcilationInProgress) {
                    this.update();
                }
            });
        }
    }

    afterReconcilation<U>(): OperatorFunction<U, U> {
        return this._renderer.afterReconcilation();
    }

    setValue<U extends T>(valueFn: TransformFn<T, U>): void;
    setValue<U extends T>(value: U): void;
    setValue<U extends T>(valueOrFn: TransformFn<T, U>): void {
        const value = isFunction(valueOrFn) ? valueOrFn(this.rawValue) : valueOrFn;

        this._renderer.render(this._factory(value), value);
    }

    resetValue(value: T): void {
        this.setValue(value);
    }

    connect(name: string, form: WForm<any>): void {
        this._renderer.connect(name, form);
        this.update();
    }

    disconnect(name: string): void {
        this._renderer.disconnect(name);
        this.update();
    }

    markAllAsPristine(): void {
        this.forEach(control => control.markAsPristine({ onlySelf: true }));
    }

    markAllAsDirty(): void {
        this.forEach(control => control.markAsDirty({ onlySelf: true }));
    }

    markAllAsTouched(): void {
        this.control.markAllAsTouched();
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
    
        onEach(this.control);
    }

    get(path: (string | number)[] | string): AbstractControl {
        const found = this.control.get(path);

        if (found == null) {
            throw new Error(`Control was not found: ${path}`);
        }

        return found;
    }

    getGroup(path: (string | number)[] | string): FormGroup {
        const control = this.get(path);

        if (!(control instanceof FormGroup)) {
            throw new Error(`Control is not FormGroup: ${path}`);
        }

        return control;
    }

    getArray(path: (string | number)[] | string): FormArray {
        const control = this.get(path);

        if (!(control instanceof FormArray)) {
            throw new Error(`Control is not FormArray: ${path}`);
        }

        return control;
    }

    has(path: (string | number)[] | string): boolean {
        return this.control.get(path) != null;
    }

    update(): void {
        const value = this.rawValue;

        this._renderer.render(this._factory(value), value);
    }
}
