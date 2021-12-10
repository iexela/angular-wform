import { Pipe, PipeTransform } from '@angular/core';
import { AbstractControl, FormControl, FormGroup } from '@angular/forms';
import { getControlTypeName } from '../../utils';

@Pipe({
    name: 'asFormGroup',
    pure: true,
})
export class AsFormGroupPipe implements PipeTransform {
    transform(control: AbstractControl | null | undefined): FormGroup {
        if (!control) {
            throw new Error(`Control is "{{control}}"`);
        }
        if (!(control instanceof FormGroup)) {
            throw new Error(`Control is not FormGroup: ${getControlTypeName(control)}`);
        }
        return control as FormGroup;
    }

}