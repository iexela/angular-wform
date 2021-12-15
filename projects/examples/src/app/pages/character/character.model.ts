import { AbstractControl, ValidationErrors } from '@angular/forms';
import { WValidatorNode } from 'angular-wform';
import { wValidator } from 'projects/core/src/lib/validators';

export enum Gender {
    Male = 'male',
    Female = 'female',
}

export enum Race {
    Human = 'human',
    Orc = 'orc',
    Gnome = 'gnome',
    Elf = 'elf',
}

export enum AnimalType {
    Mouse = 'mouse',
    Elephant = 'elaphant',
    Dog = 'dog',
    Cat = 'cat',
    Krokodile = 'krokodile',
}

export enum MeleeWeapon {
    Fist = 'fist',
    Rake = 'rake',
    Spade = 'spade',
}

export enum RangedWeapon {
    WaterGun = 'waterGun',
    Slingshot = 'slingshot',
    Spit = 'spit',
}

export interface Animal {
    type: AnimalType;
    favorite: boolean;
}

export interface CharacterAbilities {
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
}

export type CharacterAbility = keyof CharacterAbilities;

export interface CharacterSkills {
    flight: boolean;
    superStrength: boolean;
    invisibility: boolean;
    shapeshifting: boolean;
    healing: boolean;
    superSpeed: boolean;
    telekinesis: boolean;
    mindControl: boolean;
    aquaticBreathing: boolean;
}

export type CharacterSkill = keyof CharacterSkills;

export interface CharacterThing {
    id: string;
    count: number;
}

export interface Thing {
    id: string;
    name: string;
    price: number;
}

export interface Character {
    profile: {
        race: Race;
        gender: Gender;
        name?: string;
        height?: number;
        weight?: number;
    };
    abilities: CharacterAbilities;
    skills: CharacterSkills;
    money: number;
    things: CharacterThing[];
}

interface SkillConstraint {
    ability: CharacterAbility;
    min: number;
}

export function capitalCaseValidator(control: AbstractControl): ValidationErrors | null {
    return /^[A-Z]/.test((control.value || '').trim()) ? null : { capitalCase: true };
}

export function orcNameValidator(control: AbstractControl): ValidationErrors | null {
    return /(-Duc|-Argh|-Urc)$/.test((control.value || '').trim()) ? null : { orcName: true };
}

export function getAbilityMin(character: Character, ability: CharacterAbility): number {
    const race = character.profile.race;
    if (race === Race.Orc && (ability === 'strength' || ability === 'constitution')) {
        return 3;
    } else if (race === Race.Elf && (ability === 'dexterity' || ability === 'intelligence' || ability === 'wisdom')) {
        return 3;
    } else if (race === Race.Gnome && (ability === 'constitution' || ability === 'wisdom' || ability === 'charisma')) {
        return 3;
    }
    return 1;
}

export function getAbilityMax(character: Character, ability: CharacterAbility): number {
    const race = character.profile.race;
    if (race === Race.Orc) {
        if (ability === 'strength' || ability === 'constitution') {
            return 12;
        }
        else if (ability === 'intelligence' || ability === 'wisdom' || ability === 'charisma') {
            return 8;
        }
    } else if (race === Race.Elf) {
        if (ability === 'dexterity' || ability === 'intelligence' || ability === 'wisdom') {
            return 12;
        }
        else if (ability === 'strength' || ability === 'constitution') {
            return 8;
        }
    } else if (race === Race.Gnome) {
        if (ability === 'constitution' || ability === 'wisdom' || ability === 'charisma') {
            return 12;
        }
        else if (ability === 'strength' || ability === 'dexterity') {
            return 8;
        }
    }
    return 10;
}

export function getConsistentCharacter(character: Character): Character {
    return {
        ...character,
        abilities: {
            ...character.abilities,
            strength: getConsistentAbility(character, 'strength'),
            dexterity: getConsistentAbility(character, 'dexterity'),
            constitution: getConsistentAbility(character, 'constitution'), 
            intelligence: getConsistentAbility(character, 'intelligence'), 
            wisdom: getConsistentAbility(character, 'wisdom'), 
            charisma: getConsistentAbility(character, 'charisma'), 
        },
    };
}

export function getConsistentAbility(character: Character, ability: CharacterAbility): number {
    const value = character.abilities[ability];
    const min = getAbilityMin(character, ability);
    const max = getAbilityMax(character, ability);
    return value < min ? min : (value > max ? max : value);
}

export function getAbilityScoresUsed(character: Character): number {
    return CHARACTER_ABILITIES.reduce(
        (sum, ability) => sum + character.abilities[ability] - getAbilityMin(character, ability),
        0);
}

export function getAbilityScoresAvailable(character: Character): number {
    return CHARACTER_ABILITY_SCORES_MAX - getAbilityScoresUsed(character);
}

export function getSkillConstraint(skill: CharacterSkill): SkillConstraint {
    return CHARACTER_SKILL_CONSTRAINTS[skill];
}

export function getTotalCost(character: Character): number {
    return character.things.reduce((total, thing) => total + thing.count * findThing(thing.id)!.price, 0);
}

export function getBalance(character: Character): number {
    return character.money - getTotalCost(character);
}

export function skillValidator(character: Character, constraint: SkillConstraint): WValidatorNode {
    return wValidator(control => {
        return control.value && character.abilities[constraint.ability] < constraint.min
            ? { minAbility: true }
            : null;
    }, [character.abilities[constraint.ability], constraint.min]);
}

const CHARACTER_ABILITY_SCORES_MAX = 30;

const DEFAULT_ANIMALS: Animal[] = [
    { type: AnimalType.Cat, favorite: false },
    { type: AnimalType.Dog, favorite: false },
    { type: AnimalType.Mouse, favorite: false },
    { type: AnimalType.Elephant, favorite: false },
    { type: AnimalType.Krokodile, favorite: false },
];

const CHARACTER_SKILL_CONSTRAINTS: Record<CharacterSkill, SkillConstraint> = {
    aquaticBreathing: { ability: 'constitution', min: 6 },
    flight: { ability: 'dexterity', min: 6 },
    healing: { ability: 'intelligence', min: 6 },
    invisibility: { ability: 'intelligence', min: 6 },
    mindControl: { ability: 'charisma', min: 9 },
    shapeshifting: { ability: 'wisdom', min: 7 },
    superSpeed: { ability: 'dexterity', min: 5 },
    superStrength: { ability: 'strength', min: 7 },
    telekinesis: { ability: 'wisdom', min: 8 },
};

export const CHARACTER_ABILITIES: CharacterAbility[] = [
    'strength',
    'dexterity',
    'constitution',
    'intelligence',
    'wisdom',
    'charisma',
];

export const CHARACTER_SKILLS_MAX = 3;

export const CHARACTER_SKILLS: CharacterSkill[] = [
    'flight',
    'superStrength',
    'invisibility',
    'shapeshifting',
    'healing',
    'superSpeed',
    'telekinesis',
    'mindControl',
    'aquaticBreathing',
];

export const THINGS = [
    { id: '1', name: 'Small Sword', price: 120 },
    { id: '2', name: 'Sword', price: 250 },
    { id: '3', name: 'Revolver', price: 570 },
    { id: '4', name: 'Bullets (12)', price: 150 },
    { id: '5', name: 'Helmet', price: 230 },
    { id: '6', name: 'Armor', price: 780 },
    { id: '7', name: 'Food', price: 35 },
    { id: '8', name: 'Juice', price: 15 },
    { id: '9', name: 'Bandage', price: 45 },
];

export function findThing(id: string): Thing | undefined {
    return THINGS.find(thing => thing.id === id);
}

export function generateMoney(): number {
    return Math.floor(Math.random() * 1000);
}

export const defaultCharacter: Character = {
    profile: {
        race: Race.Human,
        gender: Gender.Female,
        height: 170,
        weight: 90,
    },
    abilities: {
        strength: 1,
        dexterity: 1,
        constitution: 1,
        intelligence: 1,
        wisdom: 1,
        charisma: 1,
    },
    skills: {
        flight: false,
        superStrength: false,
        invisibility: false,
        shapeshifting: false,
        healing: false,
        superSpeed: false,
        telekinesis: false,
        mindControl: false,
        aquaticBreathing: false,
    },
    money: generateMoney(),
    things: [],
};
