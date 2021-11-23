import { vValidator } from '..';
import { vValidatorAsync } from '../validators';

export const moreThan10 = vValidator(control => control.value <= 10 ? { min: true } : null);
export const even = vValidator(control => (control.value % 2) === 1 ? { even: true } : null);

export const small = vValidator(control => control.value.volume >= 80 ? { small: true } : null);
export const light = vValidator(control => control.value.weight >= 80 ? { light: true } : null);

export const moreThan10Async = vValidatorAsync(control => Promise.resolve(control.value <= 10 ? { min: true } : null));
export const evenAsync = vValidatorAsync(control => Promise.resolve((control.value % 2) === 1 ? { even: true } : null));

export const smallAsync = vValidatorAsync(control => Promise.resolve(control.value.volume >= 80 ? { small: true } : null));
export const lightAsync = vValidatorAsync(control => Promise.resolve(control.value.weight >= 80 ? { light: true } : null));

export interface Box {
    name?: string;
    weight?: number;
    volume?: number;
    fragile?: boolean;
}

export interface Flight {
    name: string;
    route: string[];
    cost: {
        price: number;
        discount: number;
    };
}

export const parcel = {
    weight: 20,
    volume: 40,
};

export const fragileParcel = {
    ...parcel,
    fragile: true,
};

export const parcelWithoutVolume = {
    weight: 20,
};

export const largeParcel = {
    weight: 20,
    volume: 100,
};

export const heavyParcel = {
    weight: 100,
    volume: 40,
};

export const heavyAndLargeParcel = {
    weight: 100,
    volume: 100,
};

export const krokodile = {
    name: 'krokodile',
    weight: 100,
    volume: 120,
};

export const elephant = {
    name: 'elephant',
    weight: 1000,
    volume: 1100,
};

export const mouse = {
    name: 'mouse',
    weight: 0.5,
    volume: 9,
};

export const fly = {
    name: 'fly',
    weight: 0.01,
    volume: 0.11,
};

export const belarusToAustralia = {
    name: 'Belarus - Australia',
    route: ['Belarus', 'Germany', 'China', 'Australia'],
    cost: {
        price: 1900.99,
        discount: 20,
    },
};

export const belarusToRussia = {
    name: 'Belarus - Russia',
    route: ['Belarus', 'Russia'],
    cost: {
        price: 19.99,
        discount: 20,
    },
};
