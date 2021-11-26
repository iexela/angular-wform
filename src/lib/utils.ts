import { VERSION } from '@angular/core';
import { AbstractControl, FormArray, FormGroup } from '@angular/forms';
import { PredicateFn, TransformFn } from './common';

type Dictionary = { [key: string]: any };

const intVersion = {
    major: parseInt(VERSION.major),
    minor: parseInt(VERSION.minor),
};

export function isAngularAtLeast(major: number, minor: number): boolean {
    if (intVersion.major < major) {
        return false;
    }
    if (intVersion.major > major) {
        return true;
    }
    if (intVersion.minor < minor) {
        return false;
    }
    return true;
}

export function mapControls<T>(control: AbstractControl, transform: TransformFn<AbstractControl, any>): any {
    if (control instanceof FormGroup) {
        return mapValues(control.controls, child => mapControls(child, transform));
    } else if (control instanceof FormArray) {
        return (control.controls || []).map(child => mapControls(child, transform));
    } else {
        return transform(control);
    }
}

export function getControlTypeName(control: AbstractControl): string {
    if (control instanceof FormGroup) {
        return 'FormGroup';
    } else if (control instanceof FormArray) {
        return 'FormArray';
    } else {
        return 'FormControl';
    }
}

export function calculateValue(control: AbstractControl): any {
    return mapControls(control, child => child.value);
}

export function mapValues<R, T extends Dictionary, K extends keyof T>(obj: T, transform: (value: T[K], key: string) => R): { [P in K]: R} {
    return Object.keys(obj || {}).reduce((result, key) => {
        result[key] = transform(obj[key], key);
        return result;
    }, {} as any);
}

export function pickBy<R extends T, T extends Dictionary, K extends keyof T>(obj: T, predicate: PredicateFn<T[K]>): R {
    return Object.keys(obj || {}).reduce((result, key) => {
        if (predicate(obj[key])) {
            result[key] = obj[key];
        }
        return result;
    }, {} as any);
}

export function isNil(value: any): value is null | undefined {
    return value == null;
}

export function arrayify<T>(value: T | T[] | null | undefined): T[] {
    if (isNil(value)) {
        return [];
    } else if (Array.isArray(value)) {
        return value;
    } else {
        return [value];
    }
}

export function flatMap<T, R>(arr: Array<T>, transform: TransformFn<T, R[]>): R[] {
    const result: R[] = [];
    arr.forEach(item => result.push(...transform(item)));
    return result;
}

export interface ObjectDiffResult {
    added: string[];
    removed: string[];
    updated: string[];
    untouched: string[];
}

export function objectDiff<T extends Dictionary>(a: T, b: T): ObjectDiffResult {
    const aKeys = Object.keys(a);
    const bKeys = Object.keys(b);

    const added = bKeys.filter(key => !a.hasOwnProperty(key));
    const removed = aKeys.filter(key => !b.hasOwnProperty(key));
    
    const common = aKeys.filter(key => b.hasOwnProperty(key));
    const updated = common.filter(key => a[key] !== b[key]);
    const untouched = common.filter(key => a[key] === b[key]);

    return { added, removed, updated, untouched };
}

export interface ArrayDiffResult {
    added: number[];
    removed: number[];
    updated: { previous: number; next: number }[];
    indexUpdated: { previous: number; next: number }[];
    untouched: number[];
}

export interface ArrayDiffUnorderedResult<T> {
    added: T[];
    removed: T[];
    common: T[];
}

export function arrayDiff<T>(a: T[], b: T[], toKey: TransformFn<T, any>, ctx?: any[]): ArrayDiffResult {
    const aIndex = indexate(a, toKey, ctx);
    const bIndex = indexate(b, toKey, ctx);

    const added = filterIterator(
        bIndex.keys(),
        key => !aIndex.has(key)).map(key => bIndex.get(key)!.index,
    );
    const removed = filterIterator(
        aIndex.keys(),
        key => !bIndex.has(key)).map(key => aIndex.get(key)!.index,
    );

    const common = filterIterator(aIndex.keys(), key => bIndex.has(key)).map(key => ({
        previous: aIndex.get(key)!.index,
        next: bIndex.get(key)!.index,
    }));
    const updated = common.filter(({ previous, next }) => a[previous] !== b[next]);
    const indexUpdated = common.filter(({ previous, next }) => a[previous] === b[next] && previous !== next);
    const untouched = common
        .filter(({ previous, next }) => a[previous] === b[next] && previous === next)
        .map(({ next }) => next);

    return { added, removed, updated, indexUpdated, untouched };
}

export function arrayDiffUnordered<T>(a: T[], b: T[]): ArrayDiffUnorderedResult<T> {
    const aIndex = new Set(a);
    const bIndex = new Set(b);

    const added = filterIterator(
        bIndex.keys(),
        key => !aIndex.has(key));

    const removed = filterIterator(
        aIndex.keys(),
        key => !bIndex.has(key));

    const common = filterIterator(aIndex.keys(), key => bIndex.has(key));

    return { added, removed, common };
}

function filterIterator<T>(iterator: IterableIterator<T>, predicate: PredicateFn<T>): T[] {
    const result: T[] = [];
    for (const item of iterator) {
        if (predicate(item)) {
            result.push(item);
        }
    }
    return result;
}

function indexate<T>(arr: T[], toKey: TransformFn<T, any>, errorCtx?: any[]): Map<any, { index: number; value: T }> {
    const items = new Map();

    arr.forEach((item, i) => {
        let key = toKey(item);

        if (key == null) {
            const path = errorCtx?.join('.');
            console.warn(`Key is undefined or null for the array item node: ${path ? path + '.' : ''}${i}`);
            key = getKeyByIndex(i);
        }
        if (items.has(key)) {
            const path = errorCtx?.join('.');
            throw new Error(`Items has the same key (${key}): ${path ? path + '.' : ''}{${items.get(key).index}, ${i}}`);
        }

        items.set(key, { index: i, value: item });
    });

    return items;
}

const cachedKeys: { [index: number]: string } = {};

function getKeyByIndex(i: number): string {
    let key = cachedKeys[i];

    if (key == null) {
        cachedKeys[i] = key = `_index_.${i}`;
    }
    
    return key;
}

export function hasField<T extends object, K extends keyof T>(obj: T, key: K): boolean {
    return obj.hasOwnProperty(key);
}
