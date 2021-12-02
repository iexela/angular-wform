import { AbstractControl, FormArray, FormControl, FormGroup } from '@angular/forms';
import { vArray, vControl, vForm, VFormBuilder, VFormNode, vGroup, vValidator } from '..';
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

export const elephant: Box = {
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

export const russiaToBelarus = {
    name: 'Russia - Belarus',
    route: ['Russia', 'Belarus'],
    cost: {
        price: 19.99,
        discount: 20,
    },
};

export const taxData = {
    tax1: 123,
    tax2: [4, 5],
}

export const vTaxModel = vGroup({
    tax1: vControl({ value: 123 }),
    tax2: vArray([vControl({ value: 4 }), vControl({ value: 5 })])
});

export const vTaxModelWithKeys = vGroup({ key: 1 }, {
    tax1: vControl({ key: 2, value: 123 }),
    tax2: vArray({ key: 3 }, [vControl({ key: 4, value: 4 }), vControl({ key: 5, value: 5 })])
});

export function createTaxControl(): AbstractControl {
    return new FormGroup({
        tax1: new FormControl(123),
        tax2: new FormArray([new FormControl(4), new FormControl(5)])
    })
}

export function createFlightVNode(value: Flight) {
    return vGroup({
        name: vControl(),
        route: vArray(value.route.map(() => vControl())),
        cost: vGroup({
            price: vControl(),
            discount: vControl(),
        }),
    });
}

export function createFlightForm(flight: Flight): FormGroup {
    return new FormGroup({
        name: new FormControl(flight.name),
        route: new FormArray([
            new FormControl(flight.route[0]),
            new FormControl(flight.route[1]),
        ]),
        cost: new FormGroup({
            price: new FormControl(flight.cost.price),
            discount: new FormControl(flight.cost.discount),
        }),
    });
}
