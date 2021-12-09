import { Component } from '@angular/core';
import { wForm, wGroup } from 'projects/core/src/public-api';

@Component({
    selector: 'wform-super',
    templateUrl: 'super.component.html',
})
export class SuperComponent {
    form = wForm(() => wGroup({})).build({});
    
    onSubmit(): void {

    }
}
