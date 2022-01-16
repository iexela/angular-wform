import { Component } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { capitalize } from '../../../utils';
import { CharacterModel } from '../character-model.service';
import { CharacterSkill, CHARACTER_SKILLS, CHARACTER_SKILLS_MAX, getSkillConstraint } from '../character.model';

@Component({
    selector: 'wform-character-skills',
    templateUrl: 'character-skills.component.html',
})
export class CharacterSkillsComponent {
    skills = CHARACTER_SKILLS;
    maxSkills = CHARACTER_SKILLS_MAX;

    get group(): FormGroup {
        return this.model.skillsGroup;
    }

    constructor(public model: CharacterModel) {

    }

    getSkillName(skill: CharacterSkill): string {
        return capitalize(skill);
    }

    getRequiredAbilityName(skill: CharacterSkill): string {
        return capitalize(getSkillConstraint(skill).ability);
    }

    getRequiredAbilityMin(skill: CharacterSkill): number {
        return getSkillConstraint(skill).min;
    }
}