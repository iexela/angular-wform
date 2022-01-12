# Motivation

Angular provides two ways to manage forms out-of-the-box:
* template-driven approach
* reactive approach

It seems that reactive approach won, because
* it provides clean separation of UI and model
* it is much easier to build complex form validation, rules and logic.
* ... generally, reactive approach is more powerful, because it is closer to the code. This way, you can use all power of the language (TS) to build a form (especially, complex form)

There are a lot of articles comparing template-driven and reactive forms
* https://blog.angular-university.io/introduction-to-angular-2-forms-template-driven-vs-model-driven/
* ...

## The Problem

On the other hand, reactive forms approach is not ideal. In some cases even template-driven form seems to be more reactive (smile), rather than a reactive one.

Consider the following example
```typescript
// model.ts
interface SystemProperty {
    valueType: 'number' | 'string' = 'string';
    strValue?: string,
    numValue?: number;
}
```
```typescript
// edit-form.component.ts
@Component(...)
class EditFormComponent {
    property: SystemProperty = { valueType: 'string' };
}
```
```html
<!-- edit-form.component.html -->
<form #form="ngForm">
    <h4>Edit System Parameter</h4>
    <label>
        <input name="valueType" type="radio" [(ngModel)]="property.valueType">
        String-based
    </label>
    <label>
        <input name="valueType" type="radio" [(ngModel)]="property.valueType">
        Number-based
    </label>
    <input name="strValue" type="text" [(ngModel)]="property.strValue" required [disabled]="property.valueType === 'number'">
    <input name="numValue" type="text" [(ngModel)]="property.numValue" required [disabled]="property.valueType === 'string'">
    <button [disabled]="form.invalid">Save</button>
</form>
```

This form is the simplest one. It allows to edit some system parameter
* There are two types of values: string and number based
* When parameter is string-based, corresponding number field is disabled
* Vica versa, when parameter is number-based, the string field is disabled

Looks simple! And it is.

If we try to rewrite this code to reactive form it will look like
```typescript
// edit-form.component.ts
@Component(...)
class EditFormComponent {
    form = this.fb.group({
        valueType: ['string', Validators.required],
        strValue: ['', Validators.required],
        // numValue should be disabled,
        // because valueType is 'string', by default
        numValue: [{ disabled: true, value: undefined }, Validators.required]
    });

    constructor(private fb: FormBuilder) {}
}
```
```html
<!-- edit-form.component.html -->
<form [formGroup]="form">
    <h4>Edit System Parameter</h4>
    <label>
        <input name="type" type="radio" formControlName="valueType">
        String-based
    </label>
    <label>
        <input name="type" type="radio" formControlName="valueType">
        Number-based
    </label>
    <input name="strValue" type="text" formControlName="strValue" required>
    <input name="numValue" type="text" formControlName="numValue" required>
    <button [disabled]="form.invalid">Save</button>
</form>
```
Not so much has changed. Subjectively template became more clean. It looks like it is a right choice to manage state of the form outside of the view layer (especially if we have a really complex form). But, actually, our form does not work as expected, because we do not manage disabled state of `strValue` and `numValue` controls. Currently `numValue` control is always disabled, regardless value of `valueType` control. Using reactive form we have to manage state of controls manually.

So, the final solution could look like
```typescript
// edit-form.component.ts
@Component(...)
class EditFormComponent {
    form = this.fb.group({
        valueType: ['string', Validators.required],
        strValue: ['', Validators.required],
        numValue: [{ disabled: true, value: undefined }, Validators.required]
    });

    constructor(private fb: FormBuilder) {}

    onTypeChange() {
        if (this.form.get('valueType')?.value === 'string') {
            this.form.get('strValue')!.enable();
            this.form.get('numValue')!.disable();
        } else {
            this.form.get('strValue')!.disable();
            this.form.get('numValue')!.enable();
        }
    }
}
```
```html
<!-- edit-form.component.html -->
<form [formGroup]="form">
    <h4>Edit System Parameter</h4>
    <label>
        <input name="type" type="radio" formControlName="valueType" (change)="onTypeChange()">
        String-based
    </label>
    <label>
        <input name="type" type="radio" formControlName="valueType" (change)="onTypeChange()">
        Number-based
    </label>
    <input name="strValue" type="text" formControlName="strValue" required>
    <input name="numValue" type="text" formControlName="numValue" required>
    <button [disabled]="form.invalid">Save</button>
</form>
```
Now, if value of `valueType` control has changed, we update state of `strValue` and `numValue` controls.

If our form has dynamic rules, like in the example, we have to manage form state manually. Moreover, we have to duplicate our business rules in the code. I mean these lines of code
```typescript
// During the creation of the form we set disable state for child controls according to the business rules
strValue: ['', Validators.required],
numValue: [{ disabled: true, value: undefined }, Validators.required]

// When type of value has changed we need to code these rules one more time
if (this.form.value.valueType === 'string') {
    this.form.get('strValue')!.enable();
    this.form.get('numValue')!.disable();
} else {
    this.form.get('strValue')!.disable();
    this.form.get('numValue')!.enable();
}
```

To summarize, more complex rules we have, more code we need to write. This is not related only to managing of disabled state of controls, we have the same problem with validators, at least.

And how about managing of a set of child controls manually. I mean adding or removing child controls of `FormGroup` /`FormArray` dynamically, like
```typescript
arrayControl.push(this.fb.group({ ... }));
...
arrayControl.removeAt(3);
...
```

It recalls the times when we had to manually manage DOM content using jQuery or DOM API.

This way, if we need to build a **reactive form** having dynamic rules and/or dynamic structure
* we have to duplicate business rules
* we have to write much **imperative code**
* and, in general, we have to write much logic...

## What can we do?

By the way, using template-driven form we do not have some of these problems. Just look at these lines
```html
<input name="strValue" type="text" [(ngModel)]="property.strValue" required [disabled]="property.valueType === 'number'">
<input name="numValue" type="text" [(ngModel)]="property.numValue" required [disabled]="property.valueType === 'string'">
```
How easy it is to manage `disabled` state! We do not need other tools here. And simplicity of this template comes from its declarative nature.
But again, if we try to make more complex things form management will spread between template and the code, and, eventually, it will be unsupportable. So, it brings us back to reactive form.

But what if we add declartive form state management for reactive forms? And it is the approach `angular-wform` library provides. It tries to mix the best from both worlds:
* you still have typical reactive form
* but you can manage its state declaratively using the single point of truth.

## How?

Let's think about virtual DOM (VDOM). It is modern approach to work effectively with DOM API. This approach is used by React, preact, and other libraries.

The whole picture is the following
1. Browser provides API to manage DOM. This API is imperative
2. Actually, it is not very convenient and effective to manage DOM using this imperative API
3. Libraries, like React, build a VDOM on top of the DOM API, that allows to manage DOM delcaratively

And that's the approach `angular-wform` library uses. It allows to describe state of the form using lightweight virtual controls, that are translated to typical reactive form controls, like `FormArray`, `FormGroup` and `FormControl`. 

Let's rewrite example above to `angular-wform` library.
```typescript
// edit-form.component.ts
@Component(...)
class EditFormComponent {
    form = wForm((property: SystemProperty) =>
        wGroup({
            valueType: wControl({
                validator: WValidators.required,
            }),
            strValue: wControl({
                validator: WValidators.required,
                disabled: property.valueType === 'number',
            }),
            numValue: wControl({
                validator: WValidators.required,
                disabled: property.valueType === 'string',
            }),
        }))
        .build({ valueType: 'string' });
}
```
```html
<!-- edit-form.component.html -->
<form [formGroup]="form.group"> <!-- form.group is a typical instance of FormGroup -->
    <h4>Edit System Parameter</h4>
    <label>
        <input name="type" type="radio" formControlName="valueType">
        String-based
    </label>
    <label>
        <input name="type" type="radio" formControlName="valueType">
        Number-based
    </label>
    <input name="strValue" type="text" formControlName="strValue" required>
    <input name="numValue" type="text" formControlName="numValue" required>
    <button [disabled]="form.invalid">Save</button>
</form>
```

That's it.

Let's consider this example in details.

### 1. Declare `WForm` instance
In the `EditFormComponent` class we declare `form` field that is instance of `WForm` class
```typescript
form = wForm(...).build(...);
```

The role of `WForm` is
* to create Angular reactive form
* to update Angular reactive form, if some changes have happenned
* to provide convenient API, like access underlying controls (`WForm.control` allows to access root control)

### 2. Take Angular reactive control from `WForm` instance
Template is quite typical. It uses standard directives provided by `@angular/forms` library. The only thing we need to do is to take root control from `WForm` instance (`form.control`)
```html
<form [formGroup]="form.control">
```

### 3. Describe the state of the form using virtual controls
`wForm` is a function that allows to describe the state of the form. It accepts another one function, called factory. Here is the simplest example
```typescript
wForm(() => wControl()).build(1)
```
This example describes the form having a single `FormControl` with the default value equal to `1`

Or more complex example,
```typescript
wForm(() => wGroup({
    username: wControl(),
    password: wControl(),
})).build({ username: '', password: '' })
```
It is a login form having root `FormGroup` with two children `username` and `password`. Both fields are equal to `''` initially

Say, we need to disable password until `username` is empty. Yeah, sounds strange, but nevertheless...
```typescript
wForm(() => wGroup({
    username: wControl(),
    password: wControl({ disabled: false }),
})).build({ username: '', password: '' })
```

Now, `password` field is disabled, by default. And... it will never be enabled. We definitely need to fix that. Actually, that's why factory function is a function. It accepts a single parameter that is the current form value. This function is called each time form value has changed. It gives you a chance to return a new form state. So, assuming that we have the following interface describing the state of the form
```typescript
interface LoginForm {
    username: string;
    password: string;
}
```
we can rewrite our example to the following
```typescript
wForm((value: LoginForm) => wGroup({
    username: wControl(),
    password: wControl({ disabled: value.username.length > 0 }),
})).build({ username: '', password: '' })
```
Now, if user type any value into `username` field, factory function is called with the new form value having not-empty `username`. As a result, `password` field will be enabled. And vice versa, if `username` field becomes empty again `password` field will be disabled.

Let's return to our original example.
```typescript
wForm((property: SystemProperty) =>
    wGroup({
        valueType: wControl({
            validator: WValidators.required,
        }),
        strValue: wControl({
            validator: WValidators.required,
            disabled: property.valueType === 'number',
        }),
        numValue: wControl({
            validator: WValidators.required,
            disabled: property.valueType === 'string',
        }),
    }))
    .build({ valueType: 'string' })
```
* Here we define a form having three controls `valueType`, `strValue` and `numValue`.
* Only `valueType` control has a default value (`valueType: 'string'`).
* All controls have `required` validator
* One of `strValue` and `numValue` controls is disabled, depending on value of `valueType` control

Let's consider what happens when we build the form.
1. `WForm` instance calls the provided factory function
1. Factory function constructs virtual controls for the form group (`wGroup`) and its children controls (`wControl`s). Since initially `valueType = 'string'`, `strValue` control is enabled (`disabled: false`), but `numberValue` control is disabled (`disabled: true`).
1. Built virtual controls are returned to `WForm` instance
1. `WForm` builds Angular controls, i.e. `FormGroup` having two `FormControl` children.
1. Now, root `FormGroup` can be found on the instance of `WForm`, as `form.control`.

When user changes value of `valueType` control to `number`, the same factory function is called. Let's consider what happens in this case.
1. `WForm` instance calls the provided factory function
1. Again, factory function constructs virtual controls for the form group (`wGroup`) and its children controls (`wControl`s). But now `valueType = 'number'`, that's why `strValue` control is disabled (`disabled: true`) and `numberValue` control is enabled (`disabled: false`).
1. Built virtual controls are returned to `WForm` instance.
1. Corresponding Angular controls already exist, so, they just updated to satisfy state of virtual controls.
1. The same `FormGroup` can be accessed as `form.control`. And it will have the same children controls.

**Note** Granular update of reactive controls according to the description contained in virtual controls is known as *reconcilation*.

## What next?

`angular-wform` library is much more powerful than you have seen in these examples.
* It allows to keep all form logic in the single source of truth
* It allows to write code robust to side effects
* It allows to make sure that form is consistent
* It allows to associate custom data with controls
* It allows to manage validators and asynchronous validators
* It allows to manage dynamic set of children controls for `FormGroup` and `FormArray` controls
* It allows to use Angular controls built outside of `wForm`
* It allows to attach to the form built outside of `wForm`
* It allows to manage large forms having parts loaded lazily
* It allows to decouple large form on smaller ones
* It allows to build form DSL that is more suitable for the task you are going to solve.
