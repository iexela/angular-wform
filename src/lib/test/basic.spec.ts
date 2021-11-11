import { vArray, vControl, vForm, vGroup, VValidators } from '..';
import { belarusToAustralia, Box, elephant, Flight, mouse } from './test-mocks';

const flightFactory = (value: Flight) => vGroup(null, {
    name: vControl(value.name),
    route: vArray(null, value.route.map(point => vControl(point))),
    cost: vGroup(null, {
        price: vControl(value.cost.price),
        discount: vControl(value.cost.discount),
    }),
    time: vControl(undefined, { disabled: true }),
});

describe('basic', () => {
    describe('virtual function', () => {
        it('should accept initial value', () => {
            const fn = jasmine.createSpy('virtual-fn').and.returnValue(vControl(1));
            vForm(fn).build(1 as number);
    
            expect(fn.calls.count()).toBe(1);
            expect(fn.calls.mostRecent().args[0]).toBe(1);
        });
    
        it('should accept value passed into "setValue" method', () => {
            const fn = jasmine.createSpy('virtual-fn').and.callFake(vControl);
            const form = vForm(fn).build(1 as number);
    
            form.setValue(5);
    
            expect(fn.calls.count()).toBe(2);
            expect(fn.calls.mostRecent().args[0]).toBe(5);
        });
    
        it('should accept current value if "update" is called', () => {
            const fn = jasmine.createSpy('virtual-fn').and.callFake(vControl);
            const form = vForm(fn).build(1 as number);
    
            form.update();
    
            expect(fn.calls.count()).toBe(2);
            expect(fn.calls.mostRecent().args[0]).toBe(1);
        });
    
        it('should not be called if value was changed using "control.setValue"', () => {
            const fn = jasmine.createSpy('virtual-fn').and.callFake(vControl);
            const form = vForm(fn).build(1 as number);
    
            form.control.setValue(5);
    
            expect(fn.calls.count()).toBe(1);
            expect(fn.calls.mostRecent().args[0]).toBe(1);
        });
    });

    describe('updateOnChange', () => {
        it('should update form as soon as some value has changed', () => {
            const factory = jasmine.createSpy('virtual-fn').and.callFake(flightFactory);

            const form = vForm(factory)
                .updateOnChange()
                .build(belarusToAustralia);

            expect(factory).toHaveBeenCalledWith(belarusToAustralia);
            expect(factory).toHaveBeenCalledTimes(1);

            form.getControl('cost.price').setValue(99);

            expect(factory).toHaveBeenCalledWith({
                ...belarusToAustralia,
                cost: {
                    ...belarusToAustralia.cost,
                    price: 99,
                },
                time: undefined,
            });
            expect(factory).toHaveBeenCalledTimes(2);
        });

        it('should update form as soon as some value has changed (even when corresponding control is disabled)', () => {
            const factory = jasmine.createSpy('virtual-fn').and.callFake(flightFactory);

            const form = vForm(factory)
                .updateOnChange()
                .build(belarusToAustralia);

            expect(factory).toHaveBeenCalledWith(belarusToAustralia);
            expect(factory).toHaveBeenCalledTimes(1);

            form.getControl('time').setValue(120);

            expect(factory).toHaveBeenCalledWith({
                ...belarusToAustralia,
                time: 120,
            });
            expect(factory).toHaveBeenCalledTimes(2);
        });
    });

    describe('valueChanges', () => {
        it('should emit once emit value once for each reconcile operation', () => {
            const subscriber = jasmine.createSpy('subscriber')
            const rawSubscriber = jasmine.createSpy('raw-subscriber')

            const form = vForm((value: Box) => vGroup(null, {
                name: vControl(value.name),
                weight: vControl(value.weight, {
                    disabled: value.volume! > 100,
                    validator: value.name === 'mouse' ? VValidators.max(10) : VValidators.max(10000),
                }),
                volume: vControl(value.volume, {
                    disabled: value.weight! < 10,
                }),
            })).build(mouse);

            form.valueChanges.subscribe(subscriber);
            form.rawValueChanges.subscribe(rawSubscriber);

            form.setValue(elephant);

            const { weight, ...elephantWithoutVolume } = elephant;

            expect(subscriber).toHaveBeenCalledOnceWith(elephantWithoutVolume);
            expect(rawSubscriber).toHaveBeenCalledOnceWith(elephant);
        });
    });
});
