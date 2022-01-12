# How to manage controls created outside of `WForm`?

Sometimes you need to inject controls created outside of `WForm`. This can happen in different cases
* when you migrate reactive form to `angular-wform` library
* when you use third-party library providing integration with `@angular/forms` and you need to *attach* controls created by third-party library to `WForm` instance
* there can be another cases...

I believe, the problem is not very popular, but anyway `angular-wform` library would not be complete without a way to solve it.

Further we consider different solutions of attaching reactive control to `WForm` instance.

## How to attach control to `WForm` instance?

The most complex problem here is to provide an example. So the example I am going to provide may seem too artificial.

Let's imagine that we use third-party library that allows us to build an uploader. Not just a simple field to upload files. No, this library allows us to build upload queues that are not bound to UI. It is quite logical, because in the common case upload process can take much time and we should not require user to remain on the page where uploading process was triggered. This way user can navigate through different parts of application while files are uploaded. Also this library provides UI components to trigger uploading and display uploading progress. Moreover it provides integration with `@angular/forms` library. And it is the most interesting part for us. This library can provide us a reactive control to trigger, display and attach status of uploading process to a form. And our application heavily use this feature.

Just to summarize this large set of words let's imagine that the library provides the following service
```typescript
@Injectable()
class UploaderService {
    createQueue(name: string): void {...}

    startUpload(queueName: string, file: File) {...}

    getUploadControl(queueName: string): FormArray;
}
```

Looking at this service
* we see that we can create upload queue (`createQueue(name)`) having provided name
* we can start uploading process using this service (`startUpload`)
* and we allow to attach state of the uploading queue to reactive controls (`getUploadControl(name)`).

It can be helpful to implement management of the upload queue via form. And, for sure, controls created by `getUploadControl` method were created without the help of `angular-wform` library. But let's imagine that we are going to embed control retrieved by this method into the form managed by `WForm`.

So, let's look at the following code
```typescript
class UploaderFormComponent implements OnInit {
    form!: WForm<UploaderForm>;

    constructor(private uploader: UploaderSerivce) {

    }

    ngOnInit() [
        const uploadControl = this.uploader.getUploadControl();

        this.form = wForm((value: UploaderForm) => wGroup({
            field1: wControl(),
            field2: wControl(),
            uploader: wNative(uploadControl),
        })).build({ ... });
    ]
}
```

Actually all we need to do is to pass third-party reactive control into the `wNative` function. And now it is managed by `WForm`! That's it.

If you try to disable the whole form `uploadControl` will be disabled too
```typescript
wGroup({ disabled: true }, {
    field1: wControl(),
    field2: wControl(),
    uploader: wNative(uploadControl),
})
```

You can also manage set of validators, disable state and other properties of `uploadControl`
```typescript
wGroup({
    field2: wControl(),
    uploader: wNative(uploadControl, {
        disabled: ...,
        validator: ...,
        asyncValidator: ...,
    }),
})
```

In the end, there is no any difference whether control was created by `WForm` instance or it was created by the third-party code.

But remember, using this approach you can manage only top-level control of `uploadControl`. It means if `uploadControl` is `FormArray` or `FormGroup` you cannot granurally manage their child controls.

## How to attach whole form to `WForm` instance?

Let's consider another example. We use an Angular library providing us an editable grid. When user starts to edit a row of this grid, the library creates a `FormGroup` for the editing row to easy form state management. The `FormGroup` has a field for each grid column. So if our grid represents number of forks and spoons for each house on Kruger street. The columns may be `streetId`, `streetName`, `forks` and `spoons`. And the created `FormGroup` will have fields having the same names.

Eventually we have the following code in the component for the method triggered by grid when editing is started.
```typescript
onStartEdit(group: FormGroup) {
    // setup validators/disabled state/etc
    // or just save reference to this form to take it later when editing will be finished
}
```

Passed `FormGroup` is a form created outside of `angular-wform` library, but we can easily bind it to `WForm`
```typescript
onStartEdit(group: FormGroup) {
    const form = wForm((value: CutleryForm) => wGroup({
        streetId: wControl(),
        streetName: wControl({ disabled: true }),
        forks: wControl({
            validator: WValidators.compose(WValidators.min(0))
        }),
        spoons: wControl({
            validator: WValidators.compose(WValidators.max(10))
        }),
    })).attach(group);
}
```

This code is not different from the previous examples we have seen. The only difference is that we do not call `build(<default value>)` method and call `attach(group)` instead. We have to pass `FormGroup` into the `attach` method call to *attach* existing reactive control to the `WForm` instance.

And again, there is no any difference whether form was created by `WForm` instance or it was created by the third-party code.

But you do need to describe full form state inside the `wForm`. For example, if original form has one more control for `knives` field, `WForm` will remove it, because there is no such field in `wnode` description.

## How to work with unmanaged controls?

Let's imagine that we have a form to make an order in the online shop. And our task is to rewrite it from pure reactive form to the form managed by `angular-wform` library.

The initial code could look like
```typescript
class OrderComponent implements OnInit {
    group!: FormGroup;

    constructor(private fb: FormBuilder) {}

    ngOnInit() {
        this.group = this.fb.group({
            items: this.fb.array([]),
        });
    }

    onItemAdd(name: string) {
        const itemGroup = this.fb.group({
            name,
            count: 1,
        });

        const itemsArray = this.group.get('items') as FormArray;
        itemsArray.push(itemsGroup);
    }
}
```

What will happen if we rewrite only initialization of the form and leave the rest part untouched? It looks strange, but if you have a really large form, which is not managed in the single component, such situation can happen.
```typescript
interface OrderForm {
    items: Array<{ id: string; count: number }>;
}

class OrderComponent implements OnInit {
    form!: WForm<OrderForm>;

    ngOnInit() {
        this.form = wForm((order: OrderForm) => wGroup({
            items: wArray(order.items.map(item => wGroup({
                id: wControl(),
                count: wControl(),
            })))
        })).build({ items: [] });
    }

    onItemAdd(id: string) {
        const itemGroup = this.fb.group({
            id,
            count: 1,
        });

        const itemsArray = this.form.group.get('items') as FormArray;
        itemsArray.push(itemsGroup);
    }
}
```

Actually in this case, `WForm` will throw an error the next time it runs reconcilation. By default, `WForm` runs in *strict mode* that does not allow to have unmanaged controls. If you really want to leave logic like in the `onItemAdd` method you have to turn *strict mode* off. You can do this during the creation of `WForm` instance.

```typescript
wForm((order: OrderForm) => wGroup({
    items: wArray(order.items.map(item => wGroup({
        id: wControl(),
        count: wControl(),
    })))
})).strict(false)
    .build({ items: [] });
```

Now, `onItemAdd` method will not throw an error and will work as expected.

**Note**. This example just demonstrates a situation. The right way to add a new item into the form managed by `WForm` in this specific case is to use more idiomatic approach provided by `angular-wform` library:
```typescript
onItemAdd(id: string) {
    this.form.setValue(order => ({
        ...order,
        items: [
            ...order.items,
            { id, count: 1},
        ],
    }));
}
```

## What is next?

On the next page you will know how create form whose parts are loaded dynamically