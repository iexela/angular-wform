import { AbstractControl } from '@angular/forms';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { filter, map, switchMap } from 'rxjs/operators';
import { Maybe } from './common';
import { WFormNode } from './model';
import { WPortal, WPortalHost } from './portal-host';
import { DEFAULT_RECONCILATION_OPTIONS, reconcile, WFormReconcilationOptions, WReconcilationRequest } from './reconcilation';

export class WFormRenderer<T> {
    private _control$$: BehaviorSubject<Maybe<AbstractControl>>;
    private _reconcilationInProgress$$ = new BehaviorSubject(false);
    private _portalHost = new WPortalHost();
    private _options: WFormReconcilationOptions;

    readonly controlObservable: Observable<AbstractControl>;
    readonly reconcilationInProgressOnbservable: Observable<boolean>;

    get control(): Maybe<AbstractControl> {
        return this._control$$.value;
    }

    get reconcilationInProgress(): boolean {
        return this._reconcilationInProgress$$.value;
    }

    constructor(options: Partial<WFormReconcilationOptions> = {}) {
        this._options = {
            ...DEFAULT_RECONCILATION_OPTIONS,
            ...options,
        };
        this._control$$ = new BehaviorSubject<Maybe<AbstractControl>>(undefined);

        this.controlObservable = this._control$$.pipe(filter(Boolean));
        this.reconcilationInProgressOnbservable = this._reconcilationInProgress$$.asObservable();
    }

    render<U extends T>(node: WFormNode, value?: U): void {
        this._reconcile({
            options: this._options,
            portalHost: this._portalHost,
            node,
            control: this.control,
            value,
        });
    }

    attach<U extends T>(control: AbstractControl, node: WFormNode, value?: U): void {
        this._reconcile({
            options: { ...this._options, strict: false },
            portalHost: this._portalHost,
            node,
            control: control,
            value,
        });
    }

    connect(name: string, portal: WPortal<any>): void {
        this._portalHost.connect(name, portal);
    }

    disconnect(name: string): void {
        this._portalHost.disconnect(name);
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
