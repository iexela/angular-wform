import { tick } from '@angular/core/testing';
import { AbstractControl } from '@angular/forms';
import { firstValueFrom, isObservable, Observable } from 'rxjs';

export function trackControl(control: AbstractControl): { changed: boolean, statusChanged: boolean, valueChanged: boolean } {
    const tracker = { statusChanged: false, valueChanged: false, changed: false };
    control.valueChanges.subscribe(() => {
        tracker.valueChanged = true;
        tracker.changed = true;
    });
    control.statusChanges.subscribe(() => {
        tracker.statusChanged = true;
        tracker.changed = true;
    });
    return tracker;
}

export function andTick<T>(value: T): T {
    tick();
    return value;
}

export function toPromise<T>(value: Observable<T> | Promise<T>): Promise<T> {
    if (isObservable(value)) {
        return firstValueFrom(value);
    }
    return value;
}
