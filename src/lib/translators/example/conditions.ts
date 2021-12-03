import { Location, FormSampleMode, SampleEnvironmentPredicate } from './model';

export function whenAll(...conditions: (SampleEnvironmentPredicate | boolean)[]): SampleEnvironmentPredicate {
    const predicates = conditions.map(toCondition);
    return env => predicates.every(p => p(env));
}

export function whenSome(...conditions: (SampleEnvironmentPredicate | boolean)[]): SampleEnvironmentPredicate {
    const predicates = conditions.map(toCondition);
    return env => predicates.some(p => p(env));
}

export function toCondition(bool: boolean | SampleEnvironmentPredicate): SampleEnvironmentPredicate {
    if (typeof bool === 'boolean') {
        return () => bool;
    }
    return bool;
}

export function whenLocation(targetLocation: Location): SampleEnvironmentPredicate {
    return ({ location }) => location === targetLocation;
}

export function whenMode(targetMode: FormSampleMode): SampleEnvironmentPredicate {
    return ({ mode }) => mode === targetMode;
}

export function whenLanguage(targetLanguage: string): SampleEnvironmentPredicate {
    return ({ language }) => language === targetLanguage;
}

export const whenApac = whenLocation(Location.APAC);
export const whenEmea = whenLocation(Location.EMEA);
export const whenAmer = whenLocation(Location.AMER);

export const whenCreateMode = whenMode(FormSampleMode.Create);
export const whenEditMode = whenMode(FormSampleMode.Edit);
export const whenCreateOrEditMode = whenSome(whenCreateMode, whenEditMode);
export const whenViewMode = whenMode(FormSampleMode.View);
