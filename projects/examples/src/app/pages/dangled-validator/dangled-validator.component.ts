import { Component, VERSION } from '@angular/core';
import { MatSnackBar } from '@angular/material';
import { wForm, wControl, wGroup } from 'angular-wform';

interface UserForm {
    name?: string;
    age?: number;
}

@Component({
    selector: 'wform-dangled-validator',
    templateUrl: 'dangled-validator.component.html',
})
export class DangledValidatorComponent {
    isAgeRequired = true;
    isDisplayAgeSection = true;
    isAffected = Number(VERSION.major) < 11;
    form = wForm((user: UserForm) => wGroup({
        name: wControl(),
        age: wControl(),
    })).build({});

    constructor(private snackBar: MatSnackBar) {}

    onSubmit(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            this.snackBar.open('Check errors in the form', 'Dismiss', {
                duration: 5000,
            });
        } else {
            this.snackBar.open('Changes are saved', 'Dismiss', {
                duration: 5000,
            });
        }
    }
}