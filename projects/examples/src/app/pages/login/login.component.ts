import { Component } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { wControl, wForm, wGroup } from 'angular-wform';

interface Welcome {
    type: 'register' | 'login';
    login?: string;
    password?: string;
    code?: number;
    phone?: string;
}

function isLogin(welcome: Welcome): boolean {
    return welcome.type === 'login';
}

function isRegister(welcome: Welcome): boolean {
    return welcome.type === 'register';
}

@Component({
    selector: 'wform-login',
    templateUrl: 'login.component.html',
})
export class LoginComponent {
    form = wForm((welcome: Welcome) => wGroup({
        type: wControl(),
        login: wControl({ required: true }),
        password: wControl({ required: true, disabled: isRegister(welcome) }),
        phone: wControl({ required: true, disabled: isLogin(welcome) }),
        code: wControl({ required: true, disabled: isLogin(welcome) }),
    })).build({ type: 'register' });

    get isLogin(): boolean {
        return isLogin(this.form.value);
    }

    get isRegister(): boolean {
        return isRegister(this.form.value);
    }

    constructor(private snackBar: MatSnackBar) {}

    onTypeChange(): void {
        this.form.setValue({ type: this.form.value.type });
    }

    onSubmit(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            this.snackBar.open('All fields are required', 'Dismiss', {
                duration: 5000,
            });
        } else {
            this.snackBar.open(this.isLogin ? 'You are logged in!' : 'Check your mailbox for instructions', 'Dismiss', {
                duration: 5000,
            });
        }
    }
}
