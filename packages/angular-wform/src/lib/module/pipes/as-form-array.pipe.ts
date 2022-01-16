import { Pipe, PipeTransform } from '@angular/core';
import { AbstractControl, FormArray, FormControl } from '@angular/forms';
import { getControlTypeName } from '../../utils';

@Pipe({
    name: 'asFormArray',
    pure: true,
})
export class AsFormArrayPipe implements PipeTransform {
    transform(control: AbstractControl | null | undefined): FormArray {
        if (!control) {
            throw new Error(`Control is nil`);
        }
        if (!(control instanceof FormArray)) {
            throw new Error(`Control is not FormArray: ${getControlTypeName(control)}`);
        }
        return control as FormArray;
    }

}