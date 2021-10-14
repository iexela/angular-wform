import { vValidator } from '..';

export const moreThan10 = vValidator(control => control.value <= 10 ? { min: true } : null);
export const even = vValidator(control => (control.value % 2) === 1 ? { even: true } : null);

export const small = vValidator(control => control.value.volume >= 80 ? { small: true } : null);
export const light = vValidator(control => control.value.weight >= 80 ? { light: true } : null);

export interface Box {
    weight?: number;
    volume?: number;
    fragile?: boolean;
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
