import { Component } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { CharacterModel } from '../character-model.service';

@Component({
    selector: 'wform-character-profile',
    templateUrl: 'character-profile.component.html',
})
export class CharacterProfileComponent {
    get group(): FormGroup {
        return this.model.profileGroup;
    }

    constructor(public model: CharacterModel) {

    }
}
