import { vControl, vForm, vGroup } from '..';
import { OptionalKeys } from '../common';
import { GetField, HasField, Is, IsNil, IsNilable, IsOptional, IsUndefined, must } from './test-types';

interface Spaceship {
    name: string;
    speed: number;
}

const first: Spaceship = {
    name: 'first',
    speed: 999999,
};

fdescribe('type', () => {
    describe('control', () => {
        it('should be "any" if value is undefined', () => {
            const form = vForm(() => vControl()).build(1);
    
            must<Is<typeof form.value, any>>(true);
        });

        it('should not take into account type of value passed into control when root value is undefined', () => {
            const form = vForm(() => vControl({ value: '1' })).build(1);
    
            must<Is<typeof form.value, any>>(true);
        });
    
        it('should be equal to value type', () => {
            const form = vForm((n: number) => vControl()).build(1);
    
            must<Is<typeof form.value, number>>(true);
        });
    
        it('should be equal to value type (complex type)', () => {
            const form = vForm((n: Spaceship) => vControl()).build(first);
    
            must<Is<typeof form.value, Spaceship>>(true);
        });
    
        it('should be equal to value type (| undefined)', () => {
            const form = vForm((n: number | undefined) => vControl()).build(1);
    
            must<Is<typeof form.value, number | undefined>>(true);
        });
    
        it('should be equal to value type (| null)', () => {
            const form = vForm((n: number | null) => vControl()).build(1);
    
            must<Is<typeof form.value, number | null>>(true);
        });
    
        it('should be equal to value type (| null | undefined)', () => {
            const form = vForm((n: number | null | undefined) => vControl()).build(1);
    
            must<Is<typeof form.value, number | null | undefined>>(true);
        });

        it('should not take into account type of value passed into control', () => {
            const form = vForm((n: number) => vControl({ value: '1' })).build(1);
    
            must<Is<typeof form.value, number>>(true);
        });
    });

    describe('group', () => {
        it('should declare all fields as "any | undefined" if value is undefined', () => {
            const form = vForm(() => vGroup({
                a: vControl(),
                b: vControl(),
            })).build({});

            form.value

            must<Is<GetField<typeof form.value, 'a'>, any | undefined>>(true);
            must<Is<GetField<typeof form.value, 'b'>, any | undefined>>(true);
        });

        it('should declare all fields as "any | undefined" if value is passed into some controls and root value is undefined', () => {
            const form = vForm(() => vGroup({
                a: vControl({ value: '1' }),
                b: vControl(),
            })).build({});

            must<Is<GetField<typeof form.value, 'a'>, any | undefined>>(true);
            must<Is<GetField<typeof form.value, 'b'>, any | undefined>>(true);
        });

        it('should save nilable type', () => {
            type TestSpaceship = {
                name?: string;
                speed: number | null;
            };

            const form = vForm((s: TestSpaceship) => vGroup({
                name: vControl(),
                speed: vControl(),
            })).build(first);

            must<Is<GetField<typeof form.value, 'name'>, string | undefined>>(true);
            must<Is<GetField<typeof form.value, 'speed'>, number | null>>(true);
            must<HasField<typeof form.value, 'volume'>>(false);
        });

        it('should declare only fields existing in the form', () => {
            type TestSpaceship = {
                name: string;
                speed: number;
                volume?: number;
            };
            const form = vForm((s: TestSpaceship) => vGroup({
                name: vControl(),
                speed: vControl(),
            })).build(first);

            must<Is<GetField<typeof form.value, 'name'>, string>>(true);
            must<Is<GetField<typeof form.value, 'speed'>, number>>(true);
            must<HasField<typeof form.value, 'volume'>>(false);
        });

        it('should declare additional fields even if they do not exist on entity', () => {
            type TestSpaceship = {
                name: string;
                speed: number;
                volume?: number;
            };
            const form = vForm((s: TestSpaceship) => vGroup({
                name: vControl(),
                speed: vControl(),
                price: vControl(),
            })).build(first);

            must<Is<GetField<typeof form.value, 'name'>, string>>(true);
            must<Is<GetField<typeof form.value, 'speed'>, number>>(true);
            must<HasField<typeof form.value, 'price'>>(true);
            must<Is<GetField<typeof form.value, 'price'>, any | undefined>>(true);
        });

        it('should declare additional field with the type of the control value', () => {
            type TestSpaceship = {
                name: string;
                speed: number;
                volume?: number;
            };
            const form = vForm((s: TestSpaceship) => vGroup({
                name: vControl(),
                speed: vControl(),
                price: vControl({ value: 1 }),
            })).build(first);

            must<Is<GetField<typeof form.value, 'price'>, number | undefined>>(true);
        });
    });

    describe('array', () => {
    });
});
