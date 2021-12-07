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

describe('type', () => {
    describe('control', () => {
        it('should be "any" if value is undefined', () => {
            const form = vForm(() => vControl()).build(1);
    
            must<Is<typeof form.value, any>>(true);
        });

        it('should take into account type of value passed into control when root value is undefined', () => {
            const form = vForm(() => vControl({ value: '1' })).build('1');
    
            must<Is<typeof form.value, string>>(true);
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

        it('should take into account type of value passed into control when root is defined', () => {
            const form = vForm((n: number) => vControl({ value: 1 })).build(1);
    
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

        it('should declare all fields as "<type> | undefined" if value is passed into some controls and root value is undefined', () => {
            const form = vForm(() => vGroup({
                a: vControl({ value: '1' }),
                b: vControl(),
            })).build({});

            must<Is<GetField<typeof form.value, 'a'>, string | undefined>>(true);
            must<Is<GetField<typeof form.value, 'b'>, any | undefined>>(true);
        });

        it('should save nilable type', () => {
            type TestSpaceship = {
                name: string | undefined;
                speed: number | null;
            };

            const form = vForm((s: TestSpaceship) => vGroup({
                name: vControl(),
                speed: vControl(),
            })).build(first);

            must<Is<GetField<typeof form.value, 'name'>, string | undefined>>(true);
            must<Is<GetField<typeof form.value, 'speed'>, number | null>>(true);
        });

        it('should save optional type', () => {
            type TestSpaceship = {
                name?: string;
                speed: number;
            };

            const form = vForm((s: TestSpaceship) => vGroup({
                name: vControl(),
                speed: vControl(),
            })).build(first);

            must<Is<GetField<typeof form.value, 'name'>, string | undefined>>(true);
        });

        it('should declare field types as is', () => {
            type TestSpaceship = {
                name: string;
                speed: number;
            };

            const form = vForm((s: TestSpaceship) => vGroup({
                name: vControl(),
                speed: vControl(),
            })).build(first);

            must<Is<GetField<typeof form.value, 'name'>, string>>(true);
            must<Is<GetField<typeof form.value, 'speed'>, number>>(true);
        });

        it('should declare only fields existing in the form', () => {
            type TestSpaceship = {
                name: string;
                speed: number;
                volume?: number;
            };
            const fn = (s: TestSpaceship) => vGroup({
                name: vControl(),
                speed: vControl(),
            });
            const form = vForm<TestSpaceship, ReturnType<typeof fn>>(fn).build(first);

            must<Is<GetField<typeof form.value, 'name'>, string>>(true);
            must<Is<GetField<typeof form.value, 'speed'>, number>>(true);
            must<HasField<typeof form.value, 'volume'>>(false);
        });

        it('should not declare additional fields if they do not exist on entity', () => {
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
            must<HasField<typeof form.value, 'price'>>(false);
        });
    });

    describe('array', () => {
    });
});
