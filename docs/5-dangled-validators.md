# Dangled validators

The problem described on this page relates to pre-11 versions of Angular. Starting from Angular 11 this problem does not exist anymore. If you do not use Angular 2-10 you can skip reading this page. Otherwise, I strongly recommend to read it.

## The problem

One of the most popular ways to assign validator to the form field is to use validator wrapped into the directive. We constantly use such kind of validators when set one of the following attributes for the `input`: `required`, `maxlength`, `min`, `max`, etc. 

```html
<input type="number" required min="1" max="99" formControlName="age">
```

Looks simple! Unfortunately, validators coming from directives has one interesting feature (? smile) for pre-11 version of Angular.

First of all, how do such validators added to the control? Let's look at the example above
1. As we can imagine, we have `FormControl` named `age`.
1. We bind `age` control to the `input` using `formControlName` directive.
1. `formControlName` directive finds all validator directives defined on the same element. These are `required`, `min` and `max`.
1. `formControlName` directive assigns all found validators to the `age` control. And here is the problem, because all these validators will never be removed.

For completeness, problem is not obvious if field is always rendered and you manage validator as in the following example
```html
<input type="number" [required]="isAgeRequired" min="1" max="99" formControlName="age">
```

Here we manage `required` validator using `isAgeRequired` property defined in the component.
Since field is always rendered this code is quite robust. When value of `isAgeRequired` property is toggled, the `required` validator will do the same.

But, if our template looks like in the following snippet we do have a problem
```html
<section *ngIf="isDisplayThisSection">
    <input type="number" [required]="isAgeRequired" min="1" max="99" formControlName="age">
</section>
```

Let's consider the following scenario
1. `isDisplayThisSection` is `true` and `isAgeRequired` field is `true`. Based on these conditions `age` field is displayed with the `required` validator assigned.
1. Let's assume that `isDisplayThisSection` flag is switched to `false`. This way, `input` for the `age` field disappears from the screen and corresponding `formControlName` directive is destroyed.
1. But we remember that `formControlName` directive has already assigned `required` validator.
1. Now, if `isAgeRequired` condition is switched to `false` this does not affect assigned `required` validator, because there is no any directive (like `formControlName`) that could handle it.
1. Even switching of `isDisplayThisSection` flag back to `true` will not fix the situation. In this case Angular creates another instance of `formControlName`, `required`, `min` and `max` directives and assigns new validators to the `age` control. So, it just duplicates all validators!

We call validator as *dangled validator* if all of the following is true
* it was defined by directive
* the directive does not exist anymore

## Typical solutions

1. The first solution is NOT to destroy form fields. So, instead of using `*ngIf` directive, just try to hide the section
```html
<section [class.hidden]="!isDisplayThisSection">
    <input type="number" [required]="isAgeRequired" min="1" max="99" formControlName="age">
</section>
```
The section will exist along with your form and you can rely on your template for managing of `required` validator.

1. The second solution is to reset set of validators manually. If you expect that set of validators can be broken, you can always reset set of validators manually.
```typescript
ageControl.setValidators(...);
```

## Why Angular 11+ versions do not have such problem

Starting from 11th version Angular can manage set of validators granurally. Generally, the problem described was fixed as soon as this feature was introduced. In the example above
```html
<section *ngIf="isDisplayThisSection">
    <input type="number" [required]="isAgeRequired" min="1" max="99" formControlName="age">
</section>
```
when `isDisplayThisSection` switches to `false` and `section` disappears, `formControlName` directive is destroyed and all validators coming from validator directives are removed.

## How `angular-wform` library can help with pre-11 version of Angular

The `angular-wform` library does not have much to propose here. Let's recall that the library saves additional validators. It is still true for validators coming from the template. It means if `age` field was defined as
```typescript
wForm(() => wGroup({
    ...
    age: wControl({
        validator: WValidators.min(18),
    })
    ...
}))
```
`age` field will have the following validators
* `min(18)` validator coming from `wnode` description
* `required` validator coming from the template
* `min(1)` validator coming from the template
* `max(99)` validator coming from the template

We can say that `WForm` does not touch other validators except for those we defined in `wnode` description. It means that `WForm` only *appends* validators coming from `wnode` description without replacing other validators. And it is a default strategy (`WValidationStrategy.Append`).

The another strategy is the *replace* strategy (`WValidationStrategy.Replace`). Using this strategy `WForm` will always replace all validators assigned to reactive control with the validators defined in `wnode` description.

So, if defined `age` field as
```typescript
wForm(() => wGroup({
    ...
    age: wControl({
        validator: WValidators.min(18),
        validationStrategy: WValidationStrategy.Replace,
    })
    ...
}))
```
`age` will have only `min(18)` validator. If `formControlName` directive tries to assign additional validators, `WForm` will eventually replace them with the only `min(18)` validator.

Generally, if some code tries to change set of validators assigned to the `age` control, the next time `WForm` will reconcile state of the form, it will restore set of validators to that defined in `wnode` description. Look at the following example
```typescript
// Initially age field has only min(18) validator
form = ...;

form.get('age').setValidators(Validators.min(20));
// Now age field has only min(20) validator

form.update();
// After update operation, age field has only min(18) validator again.
```

The drawback of the *replace* strategy that you need to duplicate ALL your validators in the `wnode` description, even if they have already been defined in the template. Otherwise, `WForm` removes them.
```typescript
wForm(() => wGroup({
    ...
    age: wControl({
        required: true,
        validator: WValidators.compose(WValidators.min(18), WValidators.max(99)),
        validationStrategy: WValidationStrategy.Replace,
    })
    ...
}))
```
Now `age` field will have the following validators
* `required` validator coming from `wnode` description
* `min(18)` validator coming from `wnode` description
* `max(99)` validator coming from `wnode` description

Also, you can define *replace* strategy for ALL form controls, just set it as default when you construct `WForm`
```typescript
wForm(() => wGroup({
    ...
    age: wControl({
        required: true,
        validator: WValidators.compose(WValidators.min(18), WValidators.max(99)),
    })
    ...
})).validationStrategy(WValidationStrategy.Replace)
```

Eventually, using *replace* strategy is not an ideal solution and it is up to you which option to choose.
* Use `Replace` strategy for ALL controls and duplicate ALL validators in `wnode` description
* Use `Replace` strategy only for some controls and duplicate ALL validators in `wnode` description
* Use `Append` strategy and hide dynamic part of a template rather than destroy them
* Use workaround, like resetting set of validators manually `control.setValidators(null)` (But do not forget to call `form.update()` after this to restore validators coming from `wnode` description)
* Do not bother about this problem. Maybe your form is always visible and does not have dynamic parts
* Migrate to Angular 11+

There is no the best solution here and you need to decide on a case by case basis weighting all cons and pros.
