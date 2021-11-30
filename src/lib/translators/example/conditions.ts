import { Location, VEnvFormMode, VEnvPredicate } from './model';

export function whenAll(...conditions: (VEnvPredicate | boolean)[]): VEnvPredicate {
    const predicates = conditions.map(toCondition);
    return env => predicates.every(p => p(env));
}

export function whenSome(...conditions: (VEnvPredicate | boolean)[]): VEnvPredicate {
    const predicates = conditions.map(toCondition);
    return env => predicates.some(p => p(env));
}

export function toCondition(bool: boolean | VEnvPredicate): VEnvPredicate {
    if (typeof bool === 'boolean') {
        return () => bool;
    }
    return bool;
}

export function whenLocation(targetLocation: Location): VEnvPredicate {
    return ({ location }) => location === targetLocation;
}

export function whenMode(targetMode: VEnvFormMode): VEnvPredicate {
    return ({ mode }) => mode === targetMode;
}

export function whenLanguage(targetLanguage: string): VEnvPredicate {
    return ({ language }) => language === targetLanguage;
}

export const whenApac = whenLocation(Location.APAC);
export const whenEmea = whenLocation(Location.EMEA);
export const whenAmer = whenLocation(Location.AMER);

export const whenCreateMode = whenMode(VEnvFormMode.Create);
export const whenEditMode = whenMode(VEnvFormMode.Edit);
export const whenCreateOrEditMode = whenSome(whenCreateMode, whenEditMode);
export const whenViewMode = whenMode(VEnvFormMode.View);
