# Dynamic Form

What if structure of our form is dynamic. The simplest case is the form to build your own pizza by adding ingredients you like. The following can be a model of this form.

```typescript
interface Ingredient {
    name: string;
    count: number;
}

interface PizzaForm {
    name: string;
    ingredients: Ingredient[];
}
```

As we see in the model, pizza can have set of ingredients and the name. Maybe your pizza will have 5 ingredients, but pizza of your friend may have 7 or more of them. Also `count` field should have corresponding validators to allow only valid range of values.

Using reactive form `ingredients` field would be represented as `FormArray` control to manage ingredients dynamically. Also you would use `FormArray.push`, `FormArray.removeAt`, etc methods to add or remove ingredients.

How could you use `angular-wform` library here? Actually nothing has changed.

```typescript
class PizzaComponent implements OnInit {
    form: WForm<PizzaForm>;

    ngOnInit() {
        this.form = wForm((pizza: PizzaForm) => wGroup({
            name: wControl(),
            ingredients: wArray(pizza.ingredients.map(ingredient =>
                wGroup({
                    key: ingredient.name,
                }, {
                    name: wControl(),
                    count: wControl({
                        validator: WValidators.compose(WValidators.min(1), WValidators.max(99)),
                    })
                })),
        })).build({
            name: '',
            ingredients: [],
        });
    }
}
```

All the same. We define structure of the form via `wnode` description. Set of `ingredients` is defined using internal `wGroup` control to declare two nested fields (`name` and `count`). And we should not forget to set unique `key` field for child controls of `wArray`. We have to do this to differentiate one nested `wGroup` from another.

And how can we add ingredient to this form using `WForm` instance? Let's recall that more idiomatic approach to work with `WForm` is to use simple values (like JS objects and primitives) rather than reactive controls (`FormControl`, `FormArray` and `FormGroup`).

Let's imagine that template triggers `onIngredientAdd` method of our component and pass name of the ingredient as an argument.

```typescript
class PizzaComponent {
    ...

    onIngredientAdd(name: string) {
        this.form.setValue(pizza => ({
            ...pizza,
            ingredients: [
                ...pizza.ingredients,
                { name, count: 1 },
            ],
        }));
    }
}
```

Here all we did was to use `form.setValue` function to modify the form value. We transformed original form value by adding one more ingredient into the list of ingredients. And that's it!

Let's explore what happens behind the scene:
1. We transformed form value by adding one more ingredient.
1. `WForm` calls factory function taking new form value.
1. Factory function is a function calculating `wnode` description. As you may see, factory function takes each ingredient and generates corresponding nested `wnode` description for it.
    ```typescript
    wGroup({
        name: wControl(),
        // Here we generate wnode description for each ingredient
        ingredients: wArray(pizza.ingredients.map(ingredient =>
            wGroup({
                key: ingredient.name,
            }, {
                name: wControl(),
                count: wControl({
                    validator: WValidators.compose(WValidators.min(1), WValidators.max(99)),
                })
            })
        ),
    })
    ```
1. `WForm` runs reconcilation based on the returned `wnode` description.
1. Since returned `wnode` description has nested `wnode` description for added ingredient, `WForm` creates corresponding reactive controls.

To implement removing of ingredients all we need to do is to filter out ingredient we want to remove.
```typescript
class PizzaComponent {
    ...

    onIngredientRemove(name: string) {
        this.form.setValue(pizza => ({
            ...pizza,
            ingredients: pizza.ingredients.filter(ingredient => ingredient.name !== name),
        }));
    }
}
```

Here...
1. We transformed form value by removing one ingredient.
1. Again, `WForm` calls factory function taking new form value without a removed ingredient.
1. `WForm` runs reconcilation based on the returned `wnode` description.
1. Since returned `wnode` description does not have nested `wnode` description for removed ingredient, `WForm` remove corresponding reactive controls.

`WForm` will continue to work correctly even if we need to put the new ingredient in a specific position. For example the following code adds new ingredient in the beginning.

```typescript
class PizzaComponent {
    ...

    onIngredientPrepend(name: string) {
        this.form.setValue(pizza => ({
            ...pizza,
            ingredients: [
                { name, count: 1 },
                ...pizza.ingredients,
            ],
        }));
    }
}
```

In this case `WForm` just adds new `FormGroup` in the beginning of `ingredients` controls.

## FormGroup

Actually, all works the same for `FormGroup`. Although, it seems it is really rare case to have dynamic set of child controls for `FormGroup`.

Nevertheless, let's imagine that we build the same form, but now our model looks like a dictionary rather than an array (I agree, it is a bad idea though...). I believe the following code is self-descriptive, so, I will not detail it.

```typescript
interface PizzaForm {
    name: string;
    ingredients: { [name: string]: number };
}
```

`WForm` factory looks slightly different in this case.

```typescript
class PizzaComponent implements OnInit {
    form: WForm<PizzaForm>;

    ngOnInit() {
        this.form = wForm((pizza: PizzaForm) => wGroup({
            name: wControl(),
            ingredients: wGroup(mapValues(pizza.ingredients, () => wControl({
                validator: WValidators.compose(WValidators.min(1), WValidators.max(99)),
            }))),
        })).build({
            name: '',
            ingredients: {},
        });
    }
}
```

Here we use **lodash** function [mapValues](https://lodash.com/docs/#mapValues). Just for brevity.

And the code to add and remove controls

```typescript
class PizzaComponent {
    ...

    onIngredientAdd(name: string) {
        this.form.setValue(pizza => ({
            ...pizza,
            ingredients: {
                ...pizza.ingredients,
                [name]: 1,
            },
        }));
    }

    onIngredientRemove(name: string) {
        this.form.setValue(pizza => ({
            ...pizza,
            ingredients: omit(pizza.ingredients, name)
        }));
    }
}
```

Here we used another **lodash** function [omit](https://lodash.com/docs/#omit).

This way, using `angular-wform` library you can work with reactive form state like with the simple JS object. You do not have to write imperative logic to manage complex reactive form state manually.

## What is next?

On the next page we will see how to manage reactive controls created outside of `angular-wform` library