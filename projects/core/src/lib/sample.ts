import { Validators } from '@angular/forms';
import { wArray, wControl, wGroup } from './basic';
import { wForm } from './builder';
import { wValidator, wValidatorFactory } from './validators';

const vRequired = wValidator(Validators.required);
const vMaxLength = wValidatorFactory(Validators.maxLength);

const person = {
    firstName: 'Alex',
    lastName: 'M',
    jobs: [{
        address: 'Bogdanovicha 155',
        name: 'Ukupnikstroyinvest',
    }],
};

const form = wForm(() => wGroup({
    disabled: true,
    children: {
        firstName: wControl({
            validator: [Validators.required, vMaxLength(10)],
            data: {
                visible: true,
            },
        }),
        lastName: wControl({
            disabled: true,
            validator: wValidator(v => null, [1, 2, 3]),
        }),
        jobs: wArray({
            children: [
                wGroup({
                    key: 1,
                    children: {
                        address: wControl({
                            required: true,
                            data: {
                                visible: true,
                            }
                        }),
                        name: wControl({
                            validator: Validators.required,
                        }),
                    },
                }),
            ],
        }),
    },
})).build(person);

const group = form.control;
const value = form.value;
const rawValue = form.rawValue;

form.setValue({
    
});

form.resetValue({
    
});

const control = form.get('jobs.0.name');

form.update();

// form.patch(markAllAsTouched);

// form.patch(markAsTouched(node => node.firstName));

// form.markAsTouched(node => node.firstName);

// form.markAsTouched(node => [
//     node.firstName,
//     node.lastName,
// ]);
