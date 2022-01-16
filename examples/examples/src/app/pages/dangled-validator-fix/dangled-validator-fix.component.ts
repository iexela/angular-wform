import { Component } from '@angular/core';
import { MatSnackBar } from '@angular/material';
import { wForm, wControl, wGroup, WValidators, WValidationStrategy } from 'angular-wform';

interface UserForm {
    name?: string;
    age?: number;
}

@Component({
    selector: 'wform-dangled-validator-fix',
    templateUrl: 'dangled-validator-fix.component.html',
})
export class DangledValidatorFixComponent {
    isAgeRequired = true;
    isDisplayAgeSection = true;
    form = wForm((user: UserForm) => wGroup({
        name: wControl(),
        age: wControl({
            required: this.isAgeRequired,
            validator: WValidators.compose(WValidators.min(1), WValidators.max(99)),
            validationStrategy: WValidationStrategy.Replace,
        }),
    })).build({});

    constructor(private snackBar: MatSnackBar) {}

    onAgeRequiredChanged(): void {
        // isAgeRequired is outside of wform.
        // So, when flag is changed we need to trigger reconcilation manually.
        // Actually, we could move isAgeRequired field inside the form
        // and get rid of manual work at all.
        this.form.update();
    }

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