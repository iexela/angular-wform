import { AbstractControl } from "@angular/forms";

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
