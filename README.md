# angular-wform

This library allows to work with Angular Reactive Forms declaratively, that makes them even more powerful

## Motivation

Angular provides two ways to manage forms:
* template-driven approach
* reactive approach

It seems that reactive approach won, because
* it provides clean separation of UI and model
* it is much easier to build complex form validation, rules and logic.
* ... generally, reactive approach is more powerful, because it is closer to the code. This way, you can use all power of the language (TS) to build a form (especially, complex form)

There are a lot of articles comparing template-driven and reactive forms
* https://blog.angular-university.io/introduction-to-angular-2-forms-template-driven-vs-model-driven/
* ...

On the other hand, Reactive Forms approach is not ideal. In some cases even template-driven form seems to be more reactive (smile), rather than a reactive one.

Consider the following example
```html
<form>
    <h4>Edit System Parameter</h4>
    <label>
        <input name="type" type="radio" [(ngModel)]="valueType">
        String-based
    </label>
    <label>
        <input name="type" type="radio" [(ngModel)]="valueType">
        Number-based
    </label>
    <input name="strValue" type="text" [(ngModel)]="strValue" required [disabled]="valueType === 'number'">
    <input name="numValue" type="text" [(ngModel)]="numValue" required [disabled]="valueType === 'string'">
    <button>Save</button>
</form>
```

This form allows to edit some system parameter
* There are two types of values: string and number based
* When parameter is string-based, corresponding number field is disabled
* Vica versa, when parameter is number-based, it is string field that is disabled

Looks simple! And it is.

If we try to rewrite this code to Reactive Form it will look like
```html
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
    <button>Save</button>
</form>
```
Not so much has changed. And subjectively form became more clean. But, 
Write much imperative code for complex forms.

*Template driven approach* allows 





This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 13.0.4.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via a platform of your choice. To use this command, you need to first add a package that implements end-to-end testing capabilities.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.io/cli) page.
