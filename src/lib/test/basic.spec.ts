import { FormArray, FormControl, FormGroup } from '@angular/forms';
import { getLastFormNode, vArray, vControl, vForm, VFormNodeType, vGroup, VValidators } from '..';
import { belarusToAustralia, Box, createTaxControl, elephant, Flight, mouse, vTaxModel, vTaxModelWithKeys } from './test-mocks';

const flightFactory = (value: Flight) => vGroup(null, {
    name: vControl(value.name),
    route: vArray(null, value.route.map(point => vControl(point))),
    cost: vGroup(null, {
        price: vControl(value.cost.price),
        discount: vControl(value.cost.discount),
    }),
    time: vControl(undefined, { disabled: true }),
});

function errorHasMessage(...strs: string[]): RegExp {
    return new RegExp(strs.map(str => str.replace(/\.|\{\}/g, ch => `\\${ch}`)).join('(.|\n)*'), 'm');
}

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

    describe('keyGenerator', () => {
        it('key generator does not generate key for existing controls', () => {
            const keyGenerator = jasmine.createSpy();
            vForm(() =>
                vGroup(null, { abc: vTaxModel }),
            ).keyGenerator(keyGenerator).build(false);

            expect(keyGenerator).not.toHaveBeenCalled();
        });

        it('key generator generates key for each restored control', () => {
            const keyGenerator = jasmine.createSpy().and.returnValues([1, 2, 3, 4, 5]);
            const form = vForm((flag) =>
                vGroup(null, flag
                        ? { abc: vTaxModel, tax: vTaxModelWithKeys }
                        : { abc: vTaxModel }),
            ).keyGenerator(keyGenerator).lenient().build(false);

            const group = form.control as FormGroup;
            group.setControl('tax', createTaxControl());

            form.setValue(true);

            expect(keyGenerator).toHaveBeenCalledTimes(5);
            expect(keyGenerator).toHaveBeenCalledWith(['tax'], { tax1: 123, tax2: [ 4, 5 ] });
            expect(keyGenerator).toHaveBeenCalledWith(['tax', 'tax1'], 123);
            expect(keyGenerator).toHaveBeenCalledWith(['tax', 'tax2'], [ 4, 5 ]);
            expect(keyGenerator).toHaveBeenCalledWith(['tax', 'tax2', 0], 4);
            expect(keyGenerator).toHaveBeenCalledWith(['tax', 'tax2', 1], 5);
            expect(getLastFormNode(form.getControl('tax')!).key).toBe(1);
            expect(getLastFormNode(form.getControl('tax.tax1')!).key).toBe(2);
            expect(getLastFormNode(form.getControl('tax.tax2')!).key).toBe(3);
            expect(getLastFormNode(form.getControl('tax.tax2.0')!).key).toBe(4);
            expect(getLastFormNode(form.getControl('tax.tax2.1')!).key).toBe(5);
            
        });
    });

    describe('valueChanges', () => {
        it('should emit value once for each reconcile operation', () => {
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

    describe('errors', () => {
        it('"getControl" should throw error if control does not exist', () => {
            const form = vForm(() => vGroup(null, {
                nested: vGroup(null, {
                    arr: vArray(null, [
                        vControl(1),
                        vGroup(null, {
                            field: vControl('abc'),
                        }),
                    ]),
                }),
            })).build({});

            expect(form.getControl('nested.arr.1.field').value).toBe('abc');
            expect(() => form.getControl('a.b.c.0')).toThrowError(errorHasMessage('a.b.c.0'));
            expect(() => form.getControl('unexisting')).toThrowError(errorHasMessage('unexisting'));
            expect(() => form.getControl('0')).toThrowError(errorHasMessage('0'));
            expect(() => form.getControl('nested.arr.1.field2')).toThrowError(errorHasMessage('nested.arr.1.field2'));
        });

        it('"array reconcilation" should throw error if several items have the same key', () => {
            const form = vForm(() => vGroup(null, {
                group: vGroup(null, {
                    nested: vArray(null, [
                        vControl(1, { key: 'abracadabra' }),
                        vControl(2, { key: 'abracadabra' }),
                    ]),
                }),
            })).build({});
            
            expect(() => form.update()).toThrowError(errorHasMessage('abracadabra', 'group.nested.{0, 1}'));
        });

        it('"render operation" should throw error if type of vnode is unknown', () => {
            expect(() => vForm(() => vGroup(null, {
                group: vGroup(null, {
                    nested: vArray(null, [
                        vControl(1, { key: 1 }),
                        { type: 100 } as any,
                        vControl(3, { key: 2 }),
                    ]),
                }),
            })).build({})).toThrowError(errorHasMessage('group.nested.1'));
        });

        it('"reconcilation of VFormControl" should throw error if type of vnode is different', () => {
            const form = vForm((flag: boolean) => vGroup(null, {
                group: vGroup(null, {
                    nested: vArray(null, [
                        vControl(1, { key: 1 }),
                        flag ? vGroup({ key: 2 }, {}) : vControl(2, { key: 2 }),
                        vControl(3, { key: 3 }),
                    ]),
                }),
            })).build(false as boolean);

            expect(() => form.setValue(true)).toThrowError(errorHasMessage(
                'group.nested.1',
                `requestedType = ${VFormNodeType[VFormNodeType.Group]}`,
                'control = FormControl',
            ));
        });

        it('"reconcilation of VFormGroup" should throw error if type of vnode is different', () => {
            const form = vForm((flag: boolean) => vGroup(null, {
                group: vGroup(null, {
                    nested: vArray(null, [
                        vControl(1, { key: 1 }),
                        flag ? vArray({ key: 2 }, []) : vGroup({ key: 2 }, {}),
                        vControl(3, { key: 3 }),
                    ]),
                }),
            })).build(false as boolean);

            expect(() => form.setValue(true)).toThrowError(errorHasMessage(
                'group.nested.1',
                `requestedType = ${VFormNodeType[VFormNodeType.Array]}`,
                'control = FormGroup',
            ));
        });

        it('"reconcilation of VFormArray" should throw error if type of vnode is different', () => {
            const form = vForm((flag: boolean) => vGroup(null, {
                group: vGroup(null, {
                    nested: vArray(null, [
                        vControl(1, { key: 1 }),
                        flag ? vControl(2, { key: 2 }) : vArray({ key: 2 }, []),
                        vControl(3, { key: 3 }),
                    ]),
                }),
            })).build(false as boolean);

            expect(() => form.setValue(true)).toThrowError(errorHasMessage(
                'group.nested.1',
                `requestedType = ${VFormNodeType[VFormNodeType.Control]}`,
                'control = FormArray',
            ));
        });

        it('"getLastFormNode" should throw error if control was never rendered', () => {
            expect(() => getLastFormNode(new FormControl())).toThrowError();
        });

        it('"render operation" should throw error if validation strategy is unknown', () => {
            const form = vForm(() => vControl(1, { required: true }))
                .validationStrategy(123 as any)
                .build(1);

            expect(() => form.update()).toThrowError();
        });

        it('should not allow unmanaged controls in strict mode', () => {
            const form = vForm(() => vGroup(null, {
                group: vGroup(null, {
                    nested: vArray(null, [
                        vControl(1, { key: 'abracadabra' }),
                        vControl(2, { key: 'abracadabra' }),
                    ]),
                }),
            })).build({});

            const array = form.getControl('group.nested') as FormArray;

            array.push(new FormControl());

            expect(() => form.update()).toThrowError(errorHasMessage('group.nested.2'));
        });
    });

    describe('console messages', () => {
        let warn: jasmine.Spy<typeof console['warn']>;

        beforeEach(() => {
            warn = spyOn(console, 'warn');
        });

        it('"array reconcilation" should print warning if item does not have a key', () => {
            const form = vForm(() => vGroup(null, {
                group: vGroup(null, {
                    nested: vArray(null, [
                        vControl(1, { key: 1 }),
                        vControl(2),
                        vControl(3, { key: 3 }),
                    ]),
                }),
            })).build({});

            form.update();

            expect(warn).toHaveBeenCalledTimes(2);
            expect(warn.calls.argsFor(0)[0]).toContain('group.nested.1');
            expect(warn.calls.argsFor(1)[0]).toContain('group.nested.1');
        });
    });
});
