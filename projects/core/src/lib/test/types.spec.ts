import { wControl, wGroup } from '../basic';
import { wForm } from '../builder';
import { GetField, HasField, Is, must } from './test-types';

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
            const form = wForm(() => wControl()).build(1);
    
            must<Is<typeof form.value, any>>(true);
        });

        it('should take into account type of value passed into control when root value is undefined', () => {
            const form = wForm(() => wControl({ value: '1' })).build('1');
    
            must<Is<typeof form.value, string>>(true);
        });
    
        it('should be equal to value type', () => {
            const form = wForm((n: number) => wControl()).build(1);
    
            must<Is<typeof form.value, number>>(true);
        });
    
        it('should be equal to value type (complex type)', () => {
            const form = wForm((n: Spaceship) => wControl()).build(first);
    
            must<Is<typeof form.value, Spaceship>>(true);
        });
    
        it('should be equal to value type (| undefined)', () => {
            const form = wForm((n: number | undefined) => wControl()).build(1);
    
            must<Is<typeof form.value, number | undefined>>(true);
        });
    
        it('should be equal to value type (| null)', () => {
            const form = wForm((n: number | null) => wControl()).build(1);
    
            must<Is<typeof form.value, number | null>>(true);
        });
    
        it('should be equal to value type (| null | undefined)', () => {
            const form = wForm((n: number | null | undefined) => wControl()).build(1);
    
            must<Is<typeof form.value, number | null | undefined>>(true);
        });

        it('should take into account type of value passed into control when root is defined', () => {
            const form = wForm((n: number) => wControl({ value: 1 })).build(1);
    
            must<Is<typeof form.value, number>>(true);
        });
    });

    describe('group', () => {
        it('should declare all fields as "any | undefined" if value is undefined', () => {
            const form = wForm(() => wGroup({
                a: wControl(),
                b: wControl(),
            })).build({});

            form.value

            must<Is<GetField<typeof form.value, 'a'>, any | undefined>>(true);
            must<Is<GetField<typeof form.value, 'b'>, any | undefined>>(true);
        });

        it('should declare all fields as "<type> | undefined" if value is passed into some controls and root value is undefined', () => {
            const form = wForm(() => wGroup({
                a: wControl({ value: '1' }),
                b: wControl(),
            })).build({});

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
            })).build(first);

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
            })).build(first);

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
            const fn = (s: TestSpaceship) => wGroup({
                name: wControl(),
                speed: wControl(),
            });
            const form = wForm<TestSpaceship, ReturnType<typeof fn>>(fn).build(first);

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
            const form = wForm((s: TestSpaceship) => wGroup({
                name: wControl(),
                speed: wControl(),
                price: wControl(),
            })).build(first);

            must<Is<GetField<typeof form.value, 'name'>, string>>(true);
            must<Is<GetField<typeof form.value, 'speed'>, number>>(true);
            must<HasField<typeof form.value, 'price'>>(false);
        });
    });

    describe('array', () => {
    });
});
