import { Injectable } from '@angular/core';
import { AbstractControl, FormArray, FormGroup } from '@angular/forms';
import { wArray, wControl, wForm, WForm, wGroup, wValidatorFactory, WValidators, wValue } from 'angular-wform';
import { capitalCaseValidator, Character, CHARACTER_SKILLS, CHARACTER_SKILLS_MAX, defaultCharacter, findThing, generateMoney, getAbilityMax, getAbilityMin, getAbilityScoresAvailable, getBalance, getConsistentCharacter, getSkillConstraint, getTotalCost, orcNameValidator, Race, skillValidator } from './character.model';

const balanceValidatorFactory = wValidatorFactory((balance: number) => () => balance < 0 ? { balance: true } : null);

@Injectable({ providedIn: 'root' })
export class CharacterModel {
    form: WForm<Character>;

    get value(): Character {
        return this.form.value;
    }

    get profileGroup(): FormGroup {
        return this.form.getGroup('profile');
    }

    get abilitiesGroup(): FormGroup {
        return this.form.getGroup('abilities');
    }

    get skillsGroup(): FormGroup {
        return this.form.getGroup('skills');
    }

    get thingsArray(): FormArray {
        return this.form.getArray('things');
    }

    get moneyControl(): AbstractControl {
        return this.form.get('money');
    }
    
    constructor() {
        this.form = wForm((character) => this.buildRootForm(character))
            .updateOnChange()
            .build(defaultCharacter);
    }

    generateMoney(): void {
        this.form.setValue(value => ({
            ...value,
            money: generateMoney(),
        }));
    }

    addThing(id: string): void {
        this.form.setValue(value => ({
            ...value,
            things: value.things.concat([{ id, count: 1 }]),
        }));
    }

    removeThing(id: string): void {
        this.form.setValue(value => ({
            ...value,
            things: value.things.filter(t => t.id !== id),
        }));
    }

    hasThing(id: string): boolean {
        return this.form.value.things.some(t => t.id === id);
    }

    getTotalCost(): number {
        return getTotalCost(this.form.value);
    }

    getBalance(): number {
        return getBalance(this.form.value);
    }

    private buildRootForm(character: Character) {
        const consistentCharacter = getConsistentCharacter(character);

        return wGroup({
            profile: this.buildProfileForm(consistentCharacter),
            abilities: this.buildAbilitiesForm(consistentCharacter),
            skills: this.buildSkillsForm(consistentCharacter),
            things: this.buildThingsForm(consistentCharacter),
            money: wControl({
                validator: balanceValidatorFactory(getBalance(character)),
                touched: true,
            }),
        });
    }

    private buildProfileForm(character: Character) {
        return wGroup({
            race: wControl(),
            gender: wControl(),
            name: wControl({
                required: true,
                validator: WValidators.compose(
                    WValidators.maxLength(50),
                    capitalCaseValidator,
                    character.profile.race === Race.Orc ? orcNameValidator : null,
                ),
            }),
            height: wControl({
                validator: WValidators.compose(WValidators.min(100), WValidators.max(250)),
            }),
            weight: wControl({
                required: true,
                validator: WValidators.compose(WValidators.min(50), WValidators.max(200)),
            }),
        });
    }

    private buildAbilitiesForm(character: Character) {
        const scoresAvailable = getAbilityScoresAvailable(character);

        return wGroup({
            scores: wValue(scoresAvailable, {
                touched: true,
                validator: WValidators.compose(
                    WValidators.min(0),
                    WValidators.max(0),
                ),
            }),
            strength: wControl({
                value: character.abilities.strength,
                required: true,
                validator: WValidators.compose(
                    WValidators.min(getAbilityMin(character, 'strength')),
                    WValidators.max(getAbilityMax(character, 'strength')),
                ),
            }),
            dexterity: wControl({
                value: character.abilities.dexterity,
                required: true,
                validator: WValidators.compose(
                    WValidators.min(getAbilityMin(character, 'dexterity')),
                    WValidators.max(getAbilityMax(character, 'dexterity')),
                ),
            }),
            constitution: wControl({
                value: character.abilities.constitution,
                required: true,
                validator: WValidators.compose(
                    WValidators.min(getAbilityMin(character, 'constitution')),
                    WValidators.max(getAbilityMax(character, 'constitution')),
                ),
            }),
            intelligence: wControl({
                value: character.abilities.intelligence,
                required: true,
                validator: WValidators.compose(
                    WValidators.min(getAbilityMin(character, 'intelligence')),
                    WValidators.max(getAbilityMax(character, 'intelligence')),
                ),
            }),
            wisdom: wControl({
                value: character.abilities.wisdom,
                required: true,
                validator: WValidators.compose(
                    WValidators.min(getAbilityMin(character, 'wisdom')),
                    WValidators.max(getAbilityMax(character, 'wisdom')),
                ),
            }),
            charisma: wControl({
                value:character.abilities.charisma,
                required: true,
                validator: WValidators.compose(
                    WValidators.min(getAbilityMin(character, 'charisma')),
                    WValidators.max(getAbilityMax(character, 'charisma')),
                ),
            }),
        });
    }

    private buildSkillsForm(character: Character) {
        const numberOfSkills = CHARACTER_SKILLS.filter(skill => character.skills[skill]).length;
        const isNoMoreSkills = numberOfSkills >= CHARACTER_SKILLS_MAX;

        return wGroup({
            flight: wControl({
                disabled: character.skills.flight ? false : isNoMoreSkills,
                validator: skillValidator(character, getSkillConstraint('flight')),
            }),
            superStrength: wControl({
                disabled: character.skills.superStrength ? false : isNoMoreSkills,
                validator: skillValidator(character, getSkillConstraint('superStrength')),
            }),
            invisibility: wControl({
                disabled: character.skills.invisibility ? false : isNoMoreSkills,
                validator: skillValidator(character, getSkillConstraint('invisibility')),
            }),
            shapeshifting: wControl({
                disabled: character.skills.shapeshifting ? false : isNoMoreSkills,
                validator: skillValidator(character, getSkillConstraint('shapeshifting')),
            }),
            healing: wControl({
                disabled: character.skills.healing ? false : isNoMoreSkills,
                validator: skillValidator(character, getSkillConstraint('healing')),
            }),
            superSpeed: wControl({
                disabled: character.skills.superSpeed ? false : isNoMoreSkills,
                validator: skillValidator(character, getSkillConstraint('superSpeed')),
            }),
            telekinesis: wControl({
                disabled: character.skills.telekinesis ? false : isNoMoreSkills,
                validator: skillValidator(character, getSkillConstraint('telekinesis')),
            }),
            mindControl: wControl({
                disabled: character.skills.mindControl ? false : isNoMoreSkills,
                validator: skillValidator(character, getSkillConstraint('mindControl')),
            }),
            aquaticBreathing: wControl({
                disabled: character.skills.aquaticBreathing ? false : isNoMoreSkills,
                validator: skillValidator(character, getSkillConstraint('aquaticBreathing')),
            }),
        });
    }

    private buildThingsForm(character: Character) {
        return wArray(character.things.map(t => wGroup({ key: t.id }, {
            id: wControl(),
            count: wControl({
                validator: WValidators.min(0),
            }),
        })));
    }
}
