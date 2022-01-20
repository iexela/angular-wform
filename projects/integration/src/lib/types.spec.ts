import { wForm, wArray, wControl, wGroup, wValue } from 'angular-wform';
import { Is, GetField, HasField, must } from './test-types';

interface Spaceship {
    name: string;
    speed: number;
}

const first: Spaceship = {
    name: 'first',
    speed: 999999,
};

describe('type', () => {
    describe('control', () => {
        it('should be "any" if value is undefined', () => {
            const form = wForm(() => wControl())
                .updateOnChange(false)
                .build(1);
    
            must<Is<typeof form.value, any>>(true);
        });

        it('should take into account type of value passed into control when root value is undefined', () => {
            const form = wForm(() => wControl({ value: '1' }))
                .updateOnChange(false)
                .build('1');
    
            must<Is<typeof form.value, string>>(true);
        });
    
        it('should be equal to value type', () => {
            const form = wForm((n: number) => wControl())
                .updateOnChange(false)
                .build(1);
    
            must<Is<typeof form.value, number>>(true);
        });
    
        it('should be equal to value type (complex type)', () => {
            const form = wForm((n: Spaceship) => wControl())
                .updateOnChange(false)
                .build(first);
    
            must<Is<typeof form.value, Spaceship>>(true);
        });
    
        it('should be equal to value type (| undefined)', () => {
            const form = wForm((n: number | undefined) => wControl())
                .updateOnChange(false)
                .build(1);
    
            must<Is<typeof form.value, number | undefined>>(true);
        });
    
        it('should be equal to value type (| null)', () => {
            const form = wForm((n: number | null) => wControl())
                .updateOnChange(false)
                .build(1);
    
            must<Is<typeof form.value, number | null>>(true);
        });
    
        it('should be equal to value type (| null | undefined)', () => {
            const form = wForm((n: number | null | undefined) => wControl())
                .updateOnChange(false)
                .build(1);
    
            must<Is<typeof form.value, number | null | undefined>>(true);
        });

        it('should take into account type of value passed into control when root is defined', () => {
            const form = wForm((n: number) => wControl({ value: 1 }))
                .updateOnChange(false)
                .build(1);
    
            must<Is<typeof form.value, number>>(true);
        });
    });

    describe('group', () => {
        it('should declare all fields as "any | undefined" if value is undefined', () => {
            const form = wForm(() => wGroup({
                a: wControl(),
                b: wControl(),
            })).updateOnChange(false).build({});

            must<Is<GetField<typeof form.value, 'a'>, any | undefined>>(true);
            must<Is<GetField<typeof form.value, 'b'>, any | undefined>>(true);
        });

        it('should declare all fields as "<type> | undefined" if value is passed into some controls and root value is undefined', () => {
            const form = wForm(() => wGroup({
                a: wControl({ value: '1' }),
                b: wControl(),
            })).updateOnChange(false).build({});

            must<Is<GetField<typeof form.value, 'a'>, string | undefined>>(true);
            must<Is<GetField<typeof form.value, 'b'>, any | undefined>>(true);
        });

        it('should save nilable type', () => {
            type TestSpaceship = {
                name: string | undefined;
                speed: number | null;
            };

            const form = wForm((s: TestSpaceship) => wGroup({
                name: wControl(),
                speed: wControl(),
            })).updateOnChange(false).build(first);

            must<Is<GetField<typeof form.value, 'name'>, string | undefined>>(true);
            must<Is<GetField<typeof form.value, 'speed'>, number | null>>(true);
        });

        it('should save optional type', () => {
            type TestSpaceship = {
                name?: string;
                speed: number;
            };

            const form = wForm((s: TestSpaceship) => wGroup({
                name: wControl(),
                speed: wControl(),
            })).updateOnChange(false).build(first);

            must<Is<GetField<typeof form.value, 'name'>, string | undefined>>(true);
        });

        it('should declare field types as is', () => {
            type TestSpaceship = {
                name: string;
                speed: number;
            };

            const form = wForm((s: TestSpaceship) => wGroup({
                name: wControl(),
                speed: wControl(),
            })).updateOnChange(false).build(first);

            must<Is<GetField<typeof form.value, 'name'>, string>>(true);
            must<Is<GetField<typeof form.value, 'speed'>, number>>(true);
        });

        it('should declare field types as is (when all fields are optional)', () => {
            type TestSpaceship = {
                name?: string;
                speed?: number;
            };

            const form = wForm((s: TestSpaceship) => wGroup({
                name: wControl(),
                speed: wControl(),
            })).updateOnChange(false).build(first);

            must<Is<GetField<typeof form.value, 'name'>, string | undefined>>(true);
            must<Is<GetField<typeof form.value, 'speed'>, number | undefined>>(true);
        });

        it('should declare only fields existing in the form', () => {
            type TestSpaceship = {
                name: string;
                speed: number;
                volume?: number;
            };
            const fn = (s: TestSpaceship) => wGroup({
                name: wControl(),
                speed: wControl(),
            });
            const form = wForm<TestSpaceship, ReturnType<typeof fn>>(fn).build(first);

            must<Is<GetField<typeof form.value, 'name'>, string>>(true);
            must<Is<GetField<typeof form.value, 'speed'>, number>>(true);
            must<HasField<typeof form.value, 'volume'>>(false);
        });

        it('should not declare additional field', () => {
            type TestSpaceship = {
                name: string;
                speed: number;
                volume?: number;
            };
            const form = wForm((s: TestSpaceship) => wGroup({
                name: wControl(),
                speed: wControl(),
                price: wControl(),
            })).updateOnChange(false).build({ ...first });

            must<HasField<typeof form.value, 'price'>>(false);
        });
        
        it('should not declare additional field if value is passed into control', () => {
            type TestSpaceship = {
                name: string;
                speed: number;
                volume?: number;
            };
            const form = wForm((s: TestSpaceship) => wGroup({
                name: wControl(),
                speed: wControl(),
                price: wValue(1),
            })).updateOnChange(false).build({ ...first });

            must<HasField<typeof form.value, 'price'>>(false);
        });
    });

    describe('array', () => {
        it('should declare all items as "any" if value is undefined', () => {
            const form = wForm(() => wArray([wControl(), wControl()]))
                .updateOnChange(false)
                .build([]);

            must<Is<typeof form.value, any[]>>(true);
        });

        it('should declare all items as "any" if any value is undefined', () => {
            const form = wForm(() => wArray([wControl({ value: 1 }), wControl()]))
                .updateOnChange(false)
                .build([]);

            must<Is<typeof form.value, any[]>>(true);
        });

        it('should declare all items as "<type>" if values of the same type are passed into all controls', () => {
            const form = wForm(() => wArray([wControl({ value: 1 }), wControl({ value: 1 })]))
                .updateOnChange(false)
                .build([]);

            must<Is<typeof form.value, number[]>>(true);
        });

        it('should declare all items as "<union of all types>" if values of different types are passed into all controls', () => {
            const form = wForm(() => wArray([wControl({ value: 1 }), wControl({ value: '1' })]))
                .updateOnChange(false)
                .build([]);

            must<Is<typeof form.value, (number | string)[]>>(true);
        });
    });
});
