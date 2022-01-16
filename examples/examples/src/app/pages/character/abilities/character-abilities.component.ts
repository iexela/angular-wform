import { Component } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { capitalize } from '../../../utils';
import { CharacterModel } from '../character-model.service';
import { CHARACTER_ABILITIES, CharacterAbility, getAbilityMin, getAbilityMax } from '../character.model';

@Component({
    selector: 'wform-character-abilities',
    templateUrl: 'character-abilities.component.html',
})
export class CharacterAbilitiesComponent {
    abilities = CHARACTER_ABILITIES;

    get group(): FormGroup {
        return this.model.abilitiesGroup;
    }

    constructor(public model: CharacterModel) {

    }

    getPlaceholder(ability: CharacterAbility): string {
        return capitalize(ability);
    }

    getMin(ability: CharacterAbility): number {
        return getAbilityMin(this.model.value, ability)
    }

    getMax(ability: CharacterAbility): number {
        return getAbilityMax(this.model.value, ability)
    }
}
