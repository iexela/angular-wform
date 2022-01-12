
## `WForm`

Let's consider the following simple form

```typescript
const form = wForm((person: PersonForm) => wGroup({
    name: wControl(),
    age: wControl(),
    parentName: wControl({ required: person.age < 13 }),
})).build({ age: 15 });
```

Pay attention that you need to call `build` function and pass in an initial value (`{ age: 15 }` in the example) to create a `form`.

`form` is an instance of `WForm` class, which provides useful methods for working with reactive form controls.
But the main purpose of `WForm` is to keep state of reactive form in sync with `wnode` description. The process of updating form state according to the `wnode` description is known as *reconcilation*.

The following are the most important methods and properties of `WForm` class.

## Root Control

In order to take root control you can use `control`, `group` or `array` properties:
```typescript
form.control // returns root control as AbstractControl
form.group // returns root FormGroup, otherwise throws an error
form.array // returns root FormArray, otherwise throws an error
```

In the example above you can use `form.group` or `form.control` to access root instance of `FormGroup`.

## Calculatable Properties

`WForm` also provides easy access to most useful properties of root control

|Property|Reactive Analogue|Description|
|---|---|---|
|`form.value`|`form.control.value`|Returns value of all enabled controls|
|`form.rawValue`|`form.control.getRawValue()`|Returns value of all controls|
|`form.valid`|`form.control.valid`|Returns whether form valid or not|
|`form.invalid`|`form.control.invalid`|Returns whether form invalid or not|

## Nested controls

In order to access nested controls you can use `get`, `getGroup` or `getArray` properties.

```typescript
// get
form.get('name') // AbstractControl
form.get('favoriteAnimals.0.name') // AbstractControl

// getGroup
form.getGroup('favoriteAnimals.0') // FormGroup

// getArray
form.getArray('favoriteAnimals') // FormArray
```

## Change Form Value

By changing the value of any form control, the form state is reconciled. Taking the example form, if we set `age` value to `10`, required validator for `parentName` field will be assigned.
```typescript
form.get('age').setValue(10);
```

On the other hand, speaking about `WForm`, more idiomatic approach to work with form value is to prefer working with simple values, rather than form controls (like `AbstractControl` and others). That's why if you need to change form value, it is encouraged to use `setValue` function:
```typescript
form.setValue({
    ...form.rawValue,
    age: 10,
});
```
Effectively, it does the same as the previous example: it sets `age` field to `10` and runs reconcilation of form state. Under the hood, it is even more effective than the previous example.

Also, you can pass function into `form.setValue`. The function takes `rawValue` and returns a new form value:
```typescript
form.setValue(value => ({
    ...value,
    age: 10,
});
```
This is the preferred way to change form value. For more details and examples, see the the section about dynamic forms [**TBD**].

## Recalculate Form State

Sometimes, all you need is to recalculate or refresh form state. Let's consider the following example. Here we define form as a part of a component
```typescript
@Component({
    selector: 'example-form',
    ...
})
class ExampleFormComponent implements OnInit {
    form!: WForm<PersonForm>;

    @Input() noSupervisionAge: number;

    ngOnInit(): void {
        this.form = wForm((person: PersonForm) => wGroup({
            name: wControl(),
            age: wControl(),
            parentName: wControl({
                required: person.age < this.noSupervisionAge,
            }),
        })).build({ age: 15 });
    }
}
```

This example is similar to the previous one, but the minimal age when kid is considered to have no supervision is managed by a component input (`noSupervisionAge`).

Let's use this component in a template
```html
<example-form [noSupervisionAge]="13">
```
Currently, it is not much different from the previous example.
1. The value of the `noSupervisionAge` is `13`.
1. `form` is created in the `ExampleFormComponent`
1. Since `15` less than `13` (the value of `noSupervisionAge`), `required` validator will not be assigned for `parentName` field.

But what if we use `example-form` component as in the following example
```html
<select [(ngModel)]="country">
    ...
    <option value="NL">Netherlands</option>
    ...
    <option value="USA">USA</option>
    ...
</select>
<example-form [noSupervisionAge]="getNoSupervisionAge(country)">
```
Here, `noSupervisionAge` is not static anymore. It depends on the selected country. And in the following scenario form will not work as expected
1. Initially, the selected country is `USA`.
1. For `USA` value of `noSupervisionAge` property is `13`
1. `form` is created in the `ExampleFormComponent`
1. Since `15` less than `13` (the value of `noSupervisionAge`), `required` validator will not be assigned for `parentName` field.
1. But user changes `country` to Netherlands.
1. For `NL` value of `noSupervisionAge` property is `16`.
1. `parentName` field MUST have `required` validator assigned, **but it does not**

This happends, because `WForm` does not know that value outside of form (`noSupervisionAge`) has changed. Indeed, form value has not changed, how `WForm` can know that form state should be updated.


Here, `form.update()` comes to help us. When we know that form state should be updated we have to trigger `form.update` manually.
So, let's rewrite our example:
```typescript
@Component({
    selector: 'example-form',
    ...
})
class ExampleFormComponent implements OnInit {
    form!: WForm<PersonForm>;

    private _noSupervisionAge!: boolean;

    @Input()
    set noSupervisionAge(flag: number) {
        this._noSupervisionAge = flag;
        if (this.form) {
            this.form.update();
        }
    }

    ngOnInit(): void {
        this.form = wForm((person: PersonForm) => wGroup({
            name: wControl(),
            age: wControl(),
            parentName: wControl({
                required: person.age < this.noSupervisionAge,
            }),
        })).build({ age: 15 });
    }
}
```

Now, we force `form` to reconcile its state as soon as `noSupervisionAge` property has changed. Back to the scenario here above, when user changes country to Netherlands and `noSupervisionAge` property becomes `16`, `required` validator will be assigned to `parentName` field.

## Debouncing control events

Each time `WForm` updates state of the reactive form, such data streams like `valueChanges` and `statusChanges` can emit several values instead of one. To avoid unmeaningful events you can use `form.afterReconcilation()` operator. It guarantees that any connected sequence will emit no more than a single value for each form update.
```typescript
form.get('pathToNestedControl')
    .valueChanges
    .pipe(form.afterReconcilation())
    .subscribe(value => {
        ...
    });
```

If you are going to subscribe to the `valueChanges` of root control, `WForm` provides `Observable` already mixed with `afterReconcilation()` operator:
```typescript
form.valueChanges
    .subscribe(value => {
        ...
    });
```

## Reactive Form Directives

You can use any directives intended to work with reactive form: `formArray`, `formGroup`, `formControl`, etc.

## Single Source of Truth and Side Effects

`angular-wform` library allows to provide a single source of truth for the form state. But, anyway, is this approach robust to side effects? What happens if you change form state outside of `angular-wform` library...

Recall how our form is defined
```typescript
const form = wForm((person: PersonForm) => wGroup({
    name: wControl(),
    age: wControl(),
    parentName: wControl({ required: person.age < 13 }),
})).build({ age: 15 });
```

What if we remove `required` validator or disable `name` field.
```typescript
form.get('parentName').validator = null;
form.get('name').disable();
```

Currently actual form state deviates from the `wnode` description. You may think that it should spoil reconcilation logic. But, actually, it is not. The library is robust enough to recover form state from `wnode` description during the next reconcilation. Reconcilation always consider current form state as the source of truth and updates only that parts of form that are different from `wnode` description.

You can force `WForm` to run reconcilation. Just call `form.update()`.
So, if you call `form.update()`, validator of `parentName` field will be restored and `name` field becomes enabled again.

**Note** Anyway, it is a bad practice to manage state outside of `WForm` library, just keep in mind that `angular-wform` library is robust for side effects.

On the other hand `WForm` is tolerant for additional validators. It means, if you add or change validator, `WForm` will not remove it, it leaves assigned validators for this control and adds (if necessary) missing validators coming from `node` description. `angular-wform` library follows this strategy, because it is OK to have validators coming from template.

For example, the following snippet declares two more validators for minimum and maximum values of `age` field. Although these validators are missing in `wnode` description `WForm` will not touch them during reconcilation.
```html
<input type="number" formControlName="age" min="1" max="99">
```
You can duplicate `min` and `max` validators in `wnode` description if you need it.

But again, even in this case, `WForm` works as expected.

See the next section to learn more about validators.