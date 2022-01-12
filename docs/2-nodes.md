# Basics

In the previous section we built a simple form. But let's return to the basics now.
`angular-wform` library builds a reactive form from the description based on virtual controls. These virtual controls are known as `wnode`s. There are three basic node types that create corresponding reactive form controls:

|Node type|Reactive form control|
|---|---|
|`wControl` or `wValue`|`FormControl`|
|`wGroup`|`FormGroup`|
|`wArray`|`FormArray`|

## Common Properties

Each control has the following properties

|Name|Type|Description|Default value|
|---|---|---|--|
|`disabled`|`boolean`|Sets disabled state of the control|`false`|
|`validator`|validator node|Check validator section for details|`undefined`|
|`asyncValidator`|async validator node|Check validator section for details|`undefined`|
|`dirty`|`boolean`|Sets dirty flag of a reactive control|current control value(*)|
|`touched`|`boolean`|Sets dirty flag of a reactive control|current control value(*)|
|`data`|key-value object|Associates custom data with reactive control|`{}`|
|`key`|`any`|Unique key of this control used to resolve conflicts|`undefined`|
|`updateOn`|one of `'change'`, `'blur'` or `'submit'`|Sets update strategy of the reactive control. It is the [standard property](https://angular.io/api/forms/AbstractControl#updateOn) of reactive controls.|`change`|

Some of these properties detailed here below.

### `dirty` and `touched` properties

Pay attention to the default value of `dirty` and `touched` properties. If these properties are not specified, corresponding properties of reactive controls are unchanged.

It means if you have the form consisting from the following control

```typescript
wForm(() => wControl());
```
its `dirty` and `touched` flag will not be managed by `angular-wform` library. The library will not try to set or unset any of these flags.

On the other hand, if some of these properties are specified
```typescript
wForm(() => wControl({ touched: true }));
```
they will always be reset to the given value on each update cycle. It can be useful when you need to keep any of these flags always set, otherwise it is not recommended to set these properties, leave default behavior.

### The `data` property

`data` property allows to associate custom data with the control.

```typescript
wForm(() => wControl({ data: { visible: true } }));
```

In this example we hold `visible` flag in `data`. We can access it later using `getData` function. It takes built `AbstractControl` as the only parameter.

```typescript
getData(form.control).visible
```

Also, `data` value may change:

```typescript
wForm(() => wControl({ data: { counter: i++ } }));
```

Each time factory function is called next `counter` value is assigned. You can track changes of `data` using `dataChanges` function. It also takes `AbstractControl` as a parameter.

```typescript
dataChanges(form.control)
    .subscribe(data => console.log(data.counter));
```

You can store any data you like in `data` and access it later in component/pipe/etc. Also, there is a `formData` pipe provided by `angular-wform` helper library. It allows to access `data` in the template.
```html
<fieldset *ngIf="(group | formData).visible">
    ...
</fieldset>
```

### The `key` property

This property is necessary for children of `wArray` node. Read more about this topic in the corresponding section (**TBD**).

### The `updateOn` property

It is a standard property of any reactive control. By design, it can be set **ONLY** when reactive control is created.

In the following example, `form.control` will always have `updateOn = WFormHooks.Blur`, because it was the value set when control was created (`n > 0`)
```typescript
const form = wForm((n: number) => wControl({
    updateOn: n > 0 ? WFormHooks.Blur: WFormHooks.Change,
})).build(1)
```

## `wControl` (or `wValue`) properties

In addition to common properties `wControl` has two more

|Name|Type|Description|Default value|
|---|---|---|--|
|`required`|`boolean`|Sets required validator|`false`|
|`value`|`any`|Sets value of the control|current control value(*)|

### The `required` property

It is so common case to provide `required` validator that `wControl` has propety to make it even easier.

```typescript
wForm(() => wControl({ required: true }))
```

### The `value` property

`value` property works the same as `dirty` and `touched` properties. If it is specified it sets value of the control, otherwise it does not touch it.

Look at these two examples
```typescript
// with value
wForm((form: LoginForm) => wGroup({
    username: wControl({ value: form.username }),
    password: wControl({ value: form.password }),
}))

// without value
wForm((form: LoginForm) => wGroup({
    username: wControl(),
    password: wControl(),
}))
```
Both these blocks of code are equal. But without `value` code looks cleaner. In most cases there is no sense to specify `value` property. It is up to you which style to choose.

Actually, sometimes, there is a sense to use `value` property. For example, when you need to make sure that value of a form is consistent.

```typescript
wForm((form: SuperHumanForm) => wGroup({
    isSuperHuman: wControl(),
    hasSuperStrength: wControl({
        value: form.isSuperHuman ? form.hasSuperStrength : false,
        disabled: !form.isSuperHuman
    }),
}))
```

Only super human (`isSuperHuman = true`) can have a super strength (`hasSuperStrength = true`). So, if user is not a super human we need to reset super strength
```
value: form.isSuperHuman ? form.hasSuperStrength : false,
```
and disable the corresponding checkbox
```
disabled: !form.isSuperHuman
```

### `wValue` node factory function

If you need to set `value` you can use `wValue` function, just for shortness. It is only difference that its first parameter is a value and the second parameter is options. It may look benefical if only thing you need to do is to set `value`

```typescript
wForm((form: SuperHumanForm) => wGroup({
    isSuperHuman: wValue(form.isSuperHuman),
    hasSuperStrength: wValue(form.isSuperHuman ? form.hasSuperStrength : false, {
        disabled: !form.isSuperHuman
    }),
}))
```

## `wArray` and `wGroup` properties

In addition to common properties `wArray` and `wGroup` have children. If you need to specify only children, pass them as the first and only argument.

```typescript
wForm(() => wGroup({
    username: wControl(),
    password: wControl(),
}))
```

If you need to specify common options too, you need to pass them as the first argument, children goes to the second argument.

```typescript
wForm(() => wGroup({ disabled: false }, {
    username: wControl(),
    password: wControl(),
}))
```

We have already seen many examples of `wGroup`. Usage of `wArray` is not much different:
```typescript
wForm((cats: CatForm[]) => wArray(cats.map(cat =>
    wGroup({
        key: cat.id
    }, {
        name: wControl(),
        age: wControl(),
    }))))
```

Pay attention that you **MUST** specify `key` property for children of `wArray`. Using `key` property `wArray` can understand which children to create, update or remove. Read more about dynamic forms in the corresponding section [**TBD**].
