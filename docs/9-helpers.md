# Helpers

The main functionality provied by `angular-wform` does not require you to import any Angular module. It does not have any services, components, directives or pipes.

But the library does declare one Angular module, which provides some utilities to easier form development. It is up to you to decide whether you need it or do not. Currently it has only several pipes, which are pretty simple, but still useful.

To import the module just add it into the `imports` section of your module

```typescript
@NgModule({
    imports: [
        ...,
        WFormModule,
    ]
    ...
})
class AppModule {

}
```

## `asForm*` pipes

Set of pipes that allow to convert rective control to the desired control type type.

Let's imagine that you have a `group` variable which is `FormGroup`. It has a child control `age` of `FormControl` type. If you tried to write the following
```html
<input type="text" [formControl]="group.get('age')">
```
you would see an error, because `group.get('age')` returns control of `AbstractControl` type, but `formControl` directive expects `FormControl` type. You could loose type condition using `$any(...)` cast function.
```html
<input type="text" [formControl]="$any(group.get('age'))">
```
But it is not type safe. Instead, you could use `asFormControl` pipe that returns `FormControl` type, but only if control is of `FormControl` type, otherwise it throws an error.
```html
<input type="text" [formControl]="group.get('age') | asFormControl">
```

The similar pipes exist for `FormGroup` and `FormArray` types

|Pipe|Reactive Control|
|---|---|
|asFormGroup|FormGroup|
|asFormArray|FormArray|
|asFormControl|FormControl|

**Note** Surely, in the example above it is better to use `formControlName` directive instead of `formControl`. Here I just demontrated the solution of a common problem.

## `formData` pipe

This pipe retrieves `data` property for the passed control.

For example, we have the following simplest form
```typescript
class SampleComponent {
    form = wForm((n: number) => wControl({
        data: {
            even: (n % 2) === 0,
        }
    })).build(0);
}
```

It has a single control and its `data` defines an `even` field which is set to `true` for even `n` and to `false` for odd `n`.

If you want to take `data` in the template you can use `formData` pipe as in the following example
```html
<input type="text" [formControl]="form.control | asFormControl">
{{(form.control | formData).even}}
```

**Note** `formData` pipe is based on `async` pipe. This means that it works correctly in the scope of `OnPush` component.

