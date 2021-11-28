import { Validators } from '@angular/forms';
import { vArray, vControl, vGroup } from './basic';
import { vForm } from './builder';
import { vValidator, vValidatorFactory } from './validators';

const vRequired = vValidator(Validators.required);
const vMaxLength = vValidatorFactory(Validators.maxLength);

const person = {
    firstName: 'Alex',
    lastName: 'M',
    jobs: [{
        address: 'Bogdanovicha 155',
        name: 'Ukupnikstroyinvest',
    }],
};

const form = vForm(() => vGroup({
    disabled: true,
    children: {
        firstName: vControl({
            validator: [Validators.required, vMaxLength(10)],
            data: {
                visible: true,
            },
        }),
        lastName: vControl({
            disabled: true,
            validator: vValidator(v => null, [1, 2, 3]),
        }),
        jobs: vArray({
            children: [
                vGroup({
                    key: 1,
                    children: {
                        address: vControl({
                            required: true,
                            data: {
                                visible: true,
                            }
                        }),
                        name: vControl({
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
