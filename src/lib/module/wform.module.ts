import { NgModule } from '@angular/core';
import { AsFormArrayPipe } from './pipes/as-form-array.pipe';
import { AsFormControlPipe } from './pipes/as-form-control.pipe';
import { AsFormGroupPipe } from './pipes/as-form-group.pipe';
import { FormDataPipe } from './pipes/form-data.pipe';

@NgModule({
    declarations: [
        AsFormArrayPipe,
        AsFormControlPipe,
        AsFormGroupPipe,
        FormDataPipe,
    ],
    exports: [
        AsFormArrayPipe,
        AsFormControlPipe,
        AsFormGroupPipe,
        FormDataPipe,
    ],
})
export class WFormModule {

}
