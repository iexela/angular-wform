import { Component } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { wControl, wForm, wGroup, wValidator, WValidators } from 'angular-wform';

interface SneackersBrand {
    name: string;
    sizes: SneackersSize[];
}

interface SneackersSize {
    size: number;
    count: number;
}

interface Sneackers {
    brand: string;
    size?: number;
    count?: number;
}

function size(size: number, count: number): SneackersSize {
    return { size, count };
}

@Component({
    selector: 'wform-sneackers',
    templateUrl: 'sneackers.component.html',
})
export class SneackersComponent {
    brands: Record<string, SneackersSize[]> = {
        'Nike': [size(39, 3), size(40, 3), size(41, 4), size(42, 0)],
        'Adidas': [size(39, 1), size(42, 0), size(43, 7), size(44, 12), size(45, 13)],
        'Reebok': [size(37, 2), size(41, 3), size(42, 0)],
    };
    availableBrands = Object.keys(this.brands);

    form = wForm((sneackers: Sneackers) => {
        const brand = sneackers.brand && this.brands[sneackers.brand];
        const size = brand && brand.find(size => size.size === sneackers.size);
        const countOfThisSize = size && size.count || 0;
        const hasOfThisSize = countOfThisSize > 0;

        return wGroup({
            brand: wControl({ required: true }),
            size: wControl({
                required: true,
                validator: wValidator(() => {
                    return hasOfThisSize ? null : { noSize: true };
                }, [hasOfThisSize]),
            }),
            count: wControl({
                value: hasOfThisSize ? sneackers.count : 0,
                disabled: !hasOfThisSize,
                required: true,
                validator: WValidators.compose(WValidators.min(1), WValidators.max(countOfThisSize)),
            }),
        });
    }).build({
        brand: this.availableBrands[0],
        size: this.brands[this.availableBrands[0]][0].size,
        count: 0,
    });

    get selectedSize(): SneackersSize | undefined {
        const { brand, size } = this.form.value;
        if (brand && size) {
            return this.brands[brand].find(s => s.size === size);
        }
        return;
    }

    constructor(private snackBar: MatSnackBar) {}

    onRemoveSize(): void {
        const selected = this.selectedSize;
        if (selected) {
            selected.count--;
            this.form.update();
            this.form.markAllAsTouched();
        }
    }

    onSubmit(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            this.snackBar.open('Fix error on the form, please', 'Dismiss', {
                duration: 5000,
            });
        } else {
            this.snackBar.open('Your sneackers are on the way to you!', 'Dismiss', {
                duration: 5000,
            });
        }
    }
}
