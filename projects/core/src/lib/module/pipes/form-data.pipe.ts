import { AsyncPipe } from '@angular/common';
import { ChangeDetectorRef, OnDestroy, Pipe, PipeTransform } from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { Observable, startWith } from 'rxjs';
import { dataChanges, getData } from '../../reconcilation';

@Pipe({
    name: 'formData',
    pure: false,
})
export class FormDataPipe implements PipeTransform, OnDestroy {
    private async: AsyncPipe;
    private lastControl?: AbstractControl;
    private stream?: Observable<Record<string, any>>;

    constructor(private changeDetectorRef: ChangeDetectorRef) {
        this.async = new AsyncPipe(this.changeDetectorRef);
    }

    ngOnDestroy(): void {
        this.async.ngOnDestroy();
    }

    transform(control: AbstractControl | null | undefined): Record<string, any> {
        if (!control) {
            throw new Error('Control is nil');
        }

        if (this.lastControl !== control) {
            this.lastControl = control;
            this.stream = dataChanges(control).pipe(startWith(getData(control)));
        }
        return this.async.transform(this.stream)!;
    }
}
