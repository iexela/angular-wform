import { AbstractControl, FormArray, FormGroup } from '@angular/forms';
import { BehaviorSubject, Observable } from 'rxjs';
import { combineLatest } from 'rxjs';
import { filter, map, switchMap } from 'rxjs/operators';
import { ProcedureFn } from './common';
import { VFormNodeFactory, VFormPatcher as VFormNodePatcher } from './model';
import { reconcile, VFormOptions, VReconcilationRequest } from './reconcilation';
import { calculateValue } from './utils';

export class VForm<T> {
    private _control$$: BehaviorSubject<AbstractControl>;
    private _factory: VFormNodeFactory<T>;
    private _options: VFormOptions;
    private _reconcilationInProgress$$ = new BehaviorSubject(false);

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

    constructor(factory: VFormNodeFactory<T>, options: VFormOptions, value: T) {
        this._options = options;

        this._control$$ = new BehaviorSubject(reconcile({
            options,
            node: factory(value),
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

    setValue(value: T): void {
        this._reconcile({
            options: this._options,
            node: this._factory(value),
            control: this.control,
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

    getControl(path: string): AbstractControl {
        const found = this.control.get(path);

        if (found == null) {
            throw new Error(`Control was not found: ${path}`);
        }

        return found;
    }

    hasControl(path: string): boolean {
        return this.control.get(path) != null;
    }

    update(): void {
        const value = this.rawValue;

        this._reconcile({
            options: this._options,
            node: this._factory(value),
            control: this.control,
        });
    }

    patch(patcher: VFormNodePatcher): void {
        this._reconcile({
            options: this._options,
            node: patcher(this.control),
            control: this.control,
        });
    }

    private _reconcile(request: VReconcilationRequest): void {
        this._reconcilationInProgress$$.next(true);
        try {
            this._control$$.next(reconcile(request));
        } finally {
            this._reconcilationInProgress$$.next(false);
        }
    }
}
