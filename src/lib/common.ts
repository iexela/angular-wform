export type Maybe<T> = T | undefined;

export type Nullable<T> = T | null;

export type Nilable<T> = T | null | undefined;

export type TransformFn<S, R> = (source: S) => R;

export type PredicateFn<T> = (value: T) => boolean;
export type TypeGuardedPredicateFn<T, K extends T = T> = (value: T) => value is K;

export type ProcedureFn<T> = (value: T) => void;
