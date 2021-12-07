import { AbstractControl, FormArray, FormGroup } from '@angular/forms';
import { BehaviorSubject, Observable } from 'rxjs';
import { combineLatest } from 'rxjs';
import { filter, map, switchMap } from 'rxjs/operators';
import { ProcedureFn } from './common';
import { WFormNode, WFormNodeFactory, WFormNodePatcher } from './model';
import { WPortalHost } from './portal-host';
import { reconcile, WFormOptions, WReconcilationRequest } from './reconcilation';
import { calculateValue } from './utils';

export class WForm<T> {
    private _control$$: BehaviorSubject<AbstractControl>;
    private _factory: WFormNodeFactory<T, WFormNode>;
    private _options: WFormOptions;
    private _reconcilationInProgress$$ = new BehaviorSubject(false);
    private _portalHost = new WPortalHost();

    readonly valueChanges: Observable<T>;
    readonly rawValueChanges: Observable<T>;

    get control(): AbstractControl {
        return this._control$$.value;
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
        this._options = options;

        this._control$$ = new BehaviorSubject(reconcile({
            options: { ...options, strict: false },
            portalHost: this._portalHost,
            node: factory(value),
            value,
            control: base,
        }));

        const nativeValueChanges = this._control$$.pipe(switchMap(control => control.valueChanges));

        this.valueChanges = combineLatest([
            nativeValueChanges,
            this._reconcilationInProgress$$,
        ]).pipe(
            filter(([_, reconcilationInProgress]: [T, boolean]) => !reconcilationInProgress),
            map(([value]) => value));

        this.rawValueChanges = this.valueChanges.pipe(map(() => this.rawValue));

        this._factory = factory;

        if (options.updateOnChange) {
            nativeValueChanges.subscribe(() => {
                if (!this._reconcilationInProgress$$.value) {
                    this.update();
                }
            });
        }
    }

    setValue<U extends T>(value: U): void {
        this._reconcile({
            options: this._options,
            portalHost: this._portalHost,
            node: this._factory(value),
            control: this.control,
            value,
        });
    }

    resetValue(value: T): void {
        this.setValue(value);
    }

    connect(name: string, form: WForm<any>): void {
        this._portalHost.setForm(name, form);
        this.update();
    }

    disconnect(name: string): void {
        this._portalHost.resetForm(name);
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

    get(path: string): AbstractControl {
        const found = this.control.get(path);

        if (found == null) {
            throw new Error(`Control was not found: ${path}`);
        }

        return found;
    }

    has(path: string): boolean {
        return this.control.get(path) != null;
    }

    update(): void {
        const value = this.rawValue;

        this._reconcile({
            options: this._options,
            portalHost: this._portalHost,
            node: this._factory(value),
            control: this.control,
            value,
        });
    }

    patch(patcher: WFormNodePatcher): void {
        this._reconcile({
            options: this._options,
            portalHost: this._portalHost,
            node: patcher(this.control),
            control: this.control,
            value: this.rawValue,
        });
    }

    private _reconcile(request: WReconcilationRequest): void {
        this._reconcilationInProgress$$.next(true);
        try {
            this._control$$.next(reconcile(request));
        } finally {
            this._reconcilationInProgress$$.next(false);
        }
    }
}
