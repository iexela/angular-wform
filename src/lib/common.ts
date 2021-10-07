export type Maybe<T> = T | undefined;

export type Nullable<T> = T | null;

export type TransformFn<S, R> = (source: S) => R;

export type PredicateFn<T> = (value: T) => boolean;

export type ProcedureFn<T> = (value: T) => void;
