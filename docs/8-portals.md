# Portals

This page covers the really rare case, the case when you have a very large form or a form whose parts are loaded dynamically. But we demonstrate the approach on a small form, it is not different for the large one.

So, let's imagine that we have a form whose parts are loaded dynamically. This means that we cannot immediately provide full `wnode` description, but only the root one.

```typescript
const form = wForm(() => wGroup({
    field1: wControl(),
    dynamic1: wPortal('external1'),
    nested: wGroup({
        nestedField1: wControl(),
        dynamic2: wPortal('external2'),
    }),
})).build({
    field1: 1,
    nested: {
        nestdField1: 2,
    },
});
```

We created a form having the following structure.
```
- field1
  - nested
    - nestedField1
```

We have also defined two slots named `external1` and `external2`. Portals allows us to define nested forms later. So, let's define one more form
```typescript
const dynamicForm1 = wForm(() => wControl()).build(3);
```

This is the simplest form with only one `FormControl`. We can attach it to the root form using one of existing slot names
```typescript
form.connect('external1', dynamicForm1);
```

Now the form will look like
```
- field1
  - dynamic1 // connected form
  - nested
    - nestedField1
```

We can disconnect child form later
```typescript
form.disconnect('external1');
```

Surely, we can attach more complex form too.
```typescript
const dynamicForm2 = wForm(() => wGroup({
    field3: wControl(),
    field4: wControl(),
})).build({
    field3: 3,
    field4: 4,
});
form.connect('external2', dynamicForm2);
```

And the result form will look like
```
- field1
  - nested
    - nestedField1
    - dynamic2
      - field3
      - field4
```

## What is next?

On the next page you will know more about useful utilities which makes development of Angular forms easier.