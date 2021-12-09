import { Component } from '@angular/core';
import { AbstractControl, ValidationErrors } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { wValue } from 'angular-wform';
import { wArray, wControl, wForm, wGroup, WValidators } from 'projects/core/src/public-api';

interface Pizza {
    size: number;
    base: 'classic' | 'thin';
    ingredients: Ingredient[];
}

interface Ingredient {
    typeId: string;
    count: number;
}

interface IngredientType {
    id: string;
    name: string;
}

const INGREDIENT_TYPES: IngredientType[] = [
    { id: 'cheese', name: 'Cheese (100g)' },
    { id: 'mushrooms', name: 'Mushrooms (50g)' },
    { id: 'sausages', name: 'Sausages (50g)' },
    { id: 'tomato', name: 'Tomato (50g)' },
    { id: 'cucumbers', name: 'Cucumbers (50g)' },
    { id: 'bacon', name: 'Bacon (50g)' },
    { id: 'jalapeno', name: 'Jalapeno (20g)' },
];

function isSmallSize(pizza: Pizza): boolean {
    return pizza.size === 23;
}

function ingredientsValidator(control: AbstractControl): ValidationErrors | null {
    if (control.value.length === 0) {
        return { noIngredients: true };
    } else if (control.value.reduce((acc: number, ingredient: Ingredient) => acc + ingredient.count, 0) > 10) {
        return { tooManyIngredients: true };
    }
    return null;
}

@Component({
    selector: 'wform-pizza',
    templateUrl: 'pizza.component.html',
})
export class PizzaComponent {
    sizes = [23, 30, 36];
    ingredientTypes = INGREDIENT_TYPES;

    form = wForm((pizza: Pizza) => wGroup({
        size: wControl({ required: true }),
        // Ensure that form is consistent: small sized pizza cannot be thin
        base: wValue(isSmallSize(pizza) ? 'classic' : pizza.base, {
            required: true,
            disabled: isSmallSize(pizza),
        }),
        ingredients: wArray({ validator: ingredientsValidator }, pizza.ingredients.map(ingredient =>
            wGroup({ key: ingredient.typeId }, {
                typeId: wControl(),
                count: wControl({
                    validator: WValidators.compose(WValidators.min(1), WValidators.max(10)),
                }),
            }))),
    })).updateOnChange().build({ size: 23, base: 'classic', ingredients: [] });

    constructor(private snackBar: MatSnackBar) {}

    getIngredientName(typeId: string): string {
        return INGREDIENT_TYPES.find(type => type.id === typeId)?.name || '';
    }

    onIngredientAdd(typeId: string): void {
        this.form.setValue(value => {
            const existingIngredient = value.ingredients.find(ingredient => ingredient.typeId === typeId);
            return {
                ...value,
                ingredients: existingIngredient
                    // If ingredient already exists, increase its counter
                    ? value.ingredients.map(ingredient => ingredient === existingIngredient
                        ? { ...ingredient, count: ingredient.count + 1 }
                        : ingredient)
                    // If ingredient does not exist, add it
                    : value.ingredients.concat([{ typeId, count: 1 }]),
            };
        });
    }

    onIngredientRemove(typeId: string): void {
        this.form.setValue(value => ({
            ...value,
            ingredients: value.ingredients.filter(ingredient => ingredient.typeId !== typeId),
        }));
    }

    onSubmit(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            this.snackBar.open('Fix error on the form, please', 'Dismiss', {
                duration: 5000,
            });
        } else {
            this.snackBar.open('Your pizza is on the way to you!', 'Dismiss', {
                duration: 5000,
            });
        }
    }
}
