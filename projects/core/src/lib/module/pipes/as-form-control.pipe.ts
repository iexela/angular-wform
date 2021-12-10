import { Pipe, PipeTransform } from '@angular/core';
import { AbstractControl, FormControl } from '@angular/forms';
import { getControlTypeName } from '../../utils';

@Pipe({
    name: 'asFormControl',
    pure: true,
})
export class AsFormControlPipe implements PipeTransform {
    transform(control: AbstractControl | null | undefined): FormControl {
        if (!control) {
            throw new Error(`Control is "{{control}}"`);
        }
        if (!(control instanceof FormControl)) {
            throw new Error(`Control is not FormControl: ${getControlTypeName(control)}`);
        }
        return control as FormControl;
    }

}