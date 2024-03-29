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

export type Is<A, B> = (<G>() => G extends A ? 1 : 2) extends (<G>() => G extends B ? 1 : 2) ? true : false;

export type Pick<T, K extends keyof T> = {
    [P in K]: T[P];
};

export type Exclude<T, U> = T extends U ? never : T;

export type Omit<T, K extends keyof any> = Pick<T, Exclude<keyof T, K>>;
