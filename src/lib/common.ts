export type Maybe<T> = T | undefined;

export type Nullable<T> = T | null;

export type Nilable<T> = T | null | undefined;

export type TransformFn<S, R> = (source: S) => R;

export type PredicateFn<T> = (value: T) => boolean;
export type TypeGuardedPredicateFn<T, K extends T = T> = (value: T) => value is K;

export type ProcedureFn<T> = (value: T) => void;

export type ArrayItemOf<T> = T extends (infer R)[] ? R : never;

export type OptionalKeys<T> = { [P in keyof T]-?: undefined extends T[P] ? P : never }[keyof T];
export type RequiredKeys<T> = Exclude<keyof T, OptionalKeys<T>>;
export type RestoreKeys<TSource, TDestination> = {
    [P in RequiredKeys<TSource> & (keyof TDestination)]: TDestination[P];
} & {
    [P in OptionalKeys<TSource> & (keyof TDestination)]?: TDestination[P];
};
