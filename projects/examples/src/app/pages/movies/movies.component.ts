import { Component } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { wArray, wControl, wForm, wGroup, wValue } from 'angular-wform';

interface MovieRestriction {
    code: string;
    age?: number;
    on: boolean;
}

interface MovieFilter {
    search?: string;
    restrictions: MovieRestriction[];
}

const MOVIE_RESTRICTIONS = [
    { code: 'All', on: true },
    { code: '0+', age: 0, on: false },
    { code: '6+', age: 6, on: false },
    { code: '12+', age: 12, on: false },
    { code: '18+', age: 18, on: false },
    { code: 'TV-14', age: 14, on: false },
];

@Component({
    selector: 'wform-movies',
    templateUrl: 'movies.component.html',
})
export class MoviesComponent {
    age = 18;
    form = wForm((filter: MovieFilter) => wGroup({
        search: wControl(),
        restrictions: wArray(filter.restrictions.map(r =>
            wGroup({
                key: r.code,
                disabled: r.age != null && this.age < r.age,
            }, {
                code: wControl(),
                age: wControl(),
                on: wValue(r.age == null || this.age >= r.age ? r.on : false),
            }))),
    })).build({
        restrictions: MOVIE_RESTRICTIONS,
    });

    constructor(private snackBar: MatSnackBar) {}

    onAgeChanged(value: number): void {
        this.age = value;
        this.form.update();
    }

    onSubmit(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            this.snackBar.open('Fix error on the form, please', 'Dismiss', {
                duration: 5000,
            });
        } else {
            this.snackBar.open('We have started to search moview!', 'Dismiss', {
                duration: 5000,
            });
        }
    }
}
