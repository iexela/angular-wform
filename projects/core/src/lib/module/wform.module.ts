import { NgModule } from '@angular/core';
import { AsFormArrayPipe } from './pipes/as-form-array.pipe';
import { AsFormControlPipe } from './pipes/as-form-control.pipe';
import { AsFormGroupPipe } from './pipes/as-form-group.pipe';
import { FormDataAsyncPipe } from './pipes/form-data-async.pipe';

@NgModule({
    declarations: [
        AsFormArrayPipe,
        AsFormControlPipe,
        AsFormGroupPipe,
        FormDataAsyncPipe,
    ],
    exports: [
        AsFormArrayPipe,
        AsFormControlPipe,
        AsFormGroupPipe,
        FormDataAsyncPipe,
    ],
})
export class WFormModule {

}
