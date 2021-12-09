import { Is, OptionalKeys, RequiredKeys } from '../common';

export type HasField<T, K extends string> = K extends keyof T ? true : false;
export type IsFieldOptional<T, K extends string> = K extends OptionalKeys<T> ? true : false;
export type IsFieldRequired<T, K extends string> = K extends RequiredKeys<T> ? true : false;
// https://stackoverflow.com/a/53808212
export type IsTrue<T> = Is<T, true>;
export type IsFalse<T> = Is<T, false>;
export type IsNil<T> = true extends (IsNull<T> | IsUndefined<T> | Is<T, null | undefined>) ? true : false;
export type IsNull<T> = Is<T, null>;
export type IsUndefined<T> = Is<T, undefined>;
export type IsNullable<T> = null extends T ? true : false;
export type IsOptional<T> = undefined extends T ? true : false;
export type IsNilable<T> = null extends T ? true : (undefined extends T ? true : false);
export type IsEmpty<T> = Is<T, []>;

export type First<T> = T extends [infer R, ...any[]] ? R : never;
export type Tail<T> = T extends [any, ...(infer R)] ? R : never;

const NO_FIELD = Symbol('no-field');
type NoField = typeof NO_FIELD;
type GetField0<T, P> = P extends NoField ? T : (P extends keyof T ? T[P] : never);
export type GetField<T, P1, P2 = NoField, P3 = NoField, P4 = NoField> = GetField0<GetField0<GetField0<GetField0<T, P1>, P2>, P3>, P4>;

export function must<T extends false>(flag: T): void;
export function must<T extends true>(flag: T): void;
export function must(_: boolean): void {
    expect(true).toBe(true);
}
