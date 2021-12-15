import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { WValidators } from 'angular-wform';
import { wValidator } from 'projects/core/src/lib/validators';
import { wControl, wForm, wGroup } from 'projects/core/src/public-api';

interface SnickersBrand {
    name: string;
    sizes: SnickersSize[];
}

interface SnickersSize {
    size: number;
    count: number;
}

interface Snickers {
    brand: string;
    size?: number;
    count?: number;
}

function size(size: number, count: number): SnickersSize {
    return { size, count };
}

@Component({
    selector: 'wform-snickers',
    templateUrl: 'snickers.component.html',
})
export class SnickersComponent {
    brands: Record<string, SnickersSize[]> = {
        'Nike': [size(39, 3), size(40, 3), size(41, 4), size(42, 0)],
        'Adidas': [size(39, 1), size(42, 0), size(43, 7), size(44, 12), size(45, 13)],
        'Reebok': [size(37, 2), size(41, 3), size(42, 0)],
    };
    availableBrands = Object.keys(this.brands);

    form = wForm((snickers: Snickers) => {
        const brand = snickers.brand && this.brands[snickers.brand];
        const size = brand && brand.find(size => size.size === snickers.size);
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
                value: hasOfThisSize ? snickers.count : 0,
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

    get selectedSize(): SnickersSize | undefined {
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
            this.snackBar.open('Your snickers are on the way to you!', 'Dismiss', {
                duration: 5000,
            });
        }
    }
}
