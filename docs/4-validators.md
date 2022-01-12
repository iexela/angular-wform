# Validators

`angular-wform` allows to manage validators effectively, to assign, remove or modify set of validators dynamically. All validators can be divided into three groups: simple validators, validator factories and compound validators.

## Simple Validators

Let's consider the following form to order sneakers
```typescript
wForm((sneakers: SneakersForm) => wGroup({
    model: wControl(),
    size: wControl(),
    count: wControl(),
}))
```
It allows to choose model of sneakers, its size and count.

But all these fields MUST be entered to order sneakers. So, we need to make all of them required. Let's add required validator.
```typescript
wForm((sneakers: SneakersForm) => wGroup({
    model: wControl({
        validator: Validators.required,
    }),
    size: wControl({
        validator: Validators.required,
    }),
    count: wControl({
        validator: Validators.required,
    }),
}))
```

It is so common to set `Validators.required` validator that `wControl` allows to set it using the corresponding property.
```typescript
wForm((sneakers: SneakersForm) => wGroup({
    model: wControl({
        required: true,
    }),
    size: wControl({
        required: true,
    }),
    count: wControl({
        required: true,
    }),
}))
```
There is no any difference in how you set required validator. But usage of `required` property looks cleaner.

### `wValidator`

What if we run out of some size for a sneacker model? Let's imagine that in this case, when we select the size, we should display error under the `size` field telling us that there is no more sneakers available of this size. This sounds like a validation and it is. Let's implement it.

```typescript
wForm((sneakers: SneakersForm) => {
    const sizesAvailable = getSizesAvailableForModel(sneackers.model);

    return wGroup({
        model: wControl({
            required: true,
        }),
        size: wControl({
            required: true,
            validator: control => {
                if (sizesAvailable.includes(control.value)) {
                    return null;
                }
                return { size: true };
            },
        }),
        count: wControl({
            required: true,
        }),
    });
})
```

In the example above we get list of available sizes for the model
```typescript
const sizesAvailable = getSizesAvailableForModel(sneackers.model);
```
and use *inlined validator* to verify if selected status comes from the list of available sizes
```typescript
control => {
    if (sizesAvailable.includes(control.value)) {
        return null;
    }
    return { size: true };
}
```
It is a typical Angular form validator implementing `ValidatorFn` signature.

Although this example works, it is not effective, because each time form state is reconciled a new validator is created and assigned to `size` field. And each time it triggers recalculation of the control validation state.

But there is no sense to create a new validator when `sizesAvailable` list is not changed. For example, when user changes `size` or `count` fields and does not change `model` field, the validator assigned to `size` field should not be changed, as `sizesAvailable` list remains the same.

Using `wValidator` function we can point out to create a new validator only when some dependent value has changed.

```typescript
wForm((sneakers: SneakersForm) => {
    const sizesAvailable = getSizesAvailableForModel(sneackers.model);

    return wGroup({
        ...
        size: wControl({
            required: true,
            validator: wValidator(control => {
                if (sizesAvailable.includes(control.value)) {
                    return null;
                }
                return { size: true };
            }, [sizesAvailable]),
        }),
        ...
    });
})
```
In this example we create validator as
```typescript
wValidator(control => {
    if (sizesAvailable.includes(control.value)) {
        return null;
    }
    return { size: true };
}, [sizesAvailable])
```
Eventually, it creates the same validator. But list of *locals* points out to update validator only when any reference in the list has changed
```typescript
[sizesAvailable]
```

This way, if we change sneacker model, then list of sizes (`sizesAvailable`) is changed, validator for `size` field is reassigned and validation state of this field is updated.

You may notice that it is very similar to React hooks.

Respectively, if you want to create *inline validator* and do not want to reassign it in the future pass empty array as *locals*.
```typescript
wValidator(control => {
    ...
}, [])
```

Generally, `wValidator` is a good way to create *inline validators*, but it is discouraged to use it for other cases.

## Validator Factories

Let's imagine that we need to constraint number of sneackers an individual can order. Say, one cannot order more than 10 sneackers.

Certainly, we can use `Validators.max(10)` to set this constraint.
```typescript
wForm((sneakers: SneakersForm) => wGroup({
    ...
    count: wControl({
        required: true,
        validator: Validators.max(10),
    }),
}))
```

But here we come to the same problem we had in the previous section: each update of the form state will create a new `Validators.max(10)`, assign it to the `count` control instead of the previous (and the same) validator and update control validity state. It seems all this work is unnecessary.

For sure, we can make something like
```typescript
wForm((sneakers: SneakersForm) => wGroup({
    ...
    count: wControl({
        required: true,
        validator: wValidator(Validators.max(10), []),
    }),
}))
```
Passing empty array of *locals* (`[]`) we make sure that this validator will never be reassigned.

But, as it was stated in the previous section, the primary use case for `wValidator` is to create inline validators.

In our case we would like to create a validator that does not depend on the form context, but has some input parameters. Actually, we need the way to create a reusable validators which may be helpful for other forms too.

### `wValidatorFactory`

*Validator factory* comes to help us. First of all, let's look at the signature of `Validators.max` function.
```
max(max: number) => ValidatorFn
```

It is a function that creates validators. Actually it is a factory of validators. But, as we know, it creates a new validator each time it is called.

To make it more suitable for `WForm` we need to wrap it into the `wValidatorFactory` function.

```typescript
const max = wValidatorFactory(Validators.max);
```
`max` is also a function and it has the similar signature.
```
max(max: number) => validator node
```
where *validator node* holds references to the factory (`Validator.max`) and arguments (like `10`, `20`, etc).
Now `max(10)` does not create the validator immediately, but delegates this process to `WForm`. In turn, `WForm` creates new validator only if arguments have changed.

Here the full example
```typescript
const max = wValidatorFactory(Validators.max);

wForm((sneakers: SneakersForm) => wGroup({
    ...
    count: wControl({
        required: true,
        validator: max(10),
    }),
}))
```

Actually, there is no sense to wrap such validators as `max`, `min`, `pattern`, etc. These are already wrapped by `wValidatorFactory` and provided under `WValidators` class.

So, this example can be rewritten as
```typescript
wForm((sneakers: SneakersForm) => wGroup({
    ...
    count: wControl({
        required: true,
        validator: WValidators.max(10),
    }),
}))
```

Anyway, if you are going to create a reusable validator it is a good practice to create it using `wValidatorFactory`.

## Compound validators

In the previous section we added `max` validator for `count` field. But it would also be reasonable to add constraint for the minimal value to avoid `0` or negative count. It means we have to add the `min` validator along with the `max` validator. In order to assign two validators for the same field we can use `WValidators.compose` function. The composed validator will run ALL validators for each entered value.
```typescript
wForm((sneakers: SneakersForm) => wGroup({
    ...
    count: wControl({
        required: true,
        validator: WValidators.compose(WValidators.min(1), WValidators.max(10)),
    }),
}))
```
Now we have specified two validators for the `count` field. Em... it is not quite true... Actually, we have specified three validators: `min`, `max` and `required`. The `required` validator is also combined with validators specified under the `validator` field. But the way how it is combined is slightly different. Eventually, it is combined using `WValidators.and` function.

The code above could also be written as
```typescript
wForm((sneakers: SneakersForm) => wGroup({
    ...
    count: wControl({
        validator: WValidators.and(
            Validators.required,
            WValidators.compose(WValidators.min(1), WValidators.max(10))
        ),
    }),
}))
```

What does `and` function do? So, it also merges all validators. But the final validator will run all functions in order and return the first error, if any. Let's consider this logic in details
* If the value was entered into the `count` field, `Validators.required` will return an error and other validators will not run. So, the error returned by `Validators.required` will be the result of `and`
* If we entered `0` into the `count` field, `Validators.required` will not return any error, but the next one validator will. And it will be the result of `and`.
* And the last case, if we entered `2` into the `count` field, no any error is returned.

### `wCompoundValidator`
Both validators created by `compose` and `and` functions are called compound validators. They allow to combine validators together. You can create own compound validator using `wCompoundValidator` function. Let's look at implemention of `and` validator
```typescript
const andValidators = wCompoundValidator(validators => {
    if (validators.length === 0) {
        return validators;
    }
    return control => validators.reduce((errors, validator) => errors || validator(control), null as ReturnType<ValidatorFn>);
});
```

Compound validator takes list of input `validators` and emits one or several output validators (in our case we have a single output validator). That's it. But, again, `WNode` will rebuild a combined validator ONLY if some dependent validator has changed.

## Async validators

The things are not much different for async validators. All of them operate on `AsyncValidatorFn`, rather than `ValidatorFn`. And you have to use corresponding function having `*Async` suffix.

|Function Name|Purpose|
|---|---|
|`wValidatorAsync`|To create inline asynchronous validator|
|`wValidatorFactoryAsync`|To create factory of asynchronous validators|
|`wCompoundValidatorAsync`|To combine asynchronous validators together|

## What next?

* Read the next topic to know more about dangled validators.
* Read [**TBD**] to know how validators work under the roof or if you still have doubts that `angular-wform` can manage them effectively.
