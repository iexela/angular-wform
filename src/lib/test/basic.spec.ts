import { FormArray, FormControl, FormGroup } from '@angular/forms';
import { getLastFormNode, vArray, vControl, vForm, VFormGroup, VFormNodeType, vGroup, VValidators } from '..';
import { vNative, vPortal, vSkip } from '../basic';
import { belarusToAustralia, belarusToRussia, Box, createFlightForm, createFlightVNode, createTaxControl, elephant, Flight, mouse, russiaToBelarus, vTaxModel, vTaxModelWithKeys } from './test-mocks';

const flightFactory = (value: Flight) => vGroup({
    name: vControl(),
    route: vArray(value.route.map(() => vControl())),
    cost: vGroup({
        price: vControl(),
        discount: vControl(),
    }),
    time: vControl({ disabled: true }),
});

function errorHasMessage(...strs: string[]): RegExp {
    return new RegExp(strs.map(str => str.replace(/\.|\{\}/g, ch => `\\${ch}`)).join('(.|\n)*'), 'm');
}

describe('basic', () => {
    describe('virtual function', () => {
        it('should accept initial value', () => {
            const fn = jasmine.createSpy('virtual-fn').and.returnValue(vControl());
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

    describe('attach', () => {
        it('should attach existing reactive form to vform', () => {
            const control = createFlightForm(belarusToRussia);

            const form = vForm(createFlightVNode).attach(control);

            expect(form.value).toEqual(belarusToRussia);
            expect(form.control).toBe(control);
            
            form.setValue(russiaToBelarus);
            
            expect(form.value).toEqual(russiaToBelarus);
            expect(form.control).toBe(control);

            form.setValue(belarusToAustralia);

            expect(form.value).toEqual(belarusToAustralia);
            expect(form.control).toBe(control);
        });

        it('should leave builder in "strict" mode', () => {
            const control = createFlightForm(belarusToRussia);

            const form = vForm(createFlightVNode).attach(control);

            const group = form.control as FormGroup;

            group.setControl('tax', new FormControl(123));

            expect(() => form.update()).toThrowError(errorHasMessage('strict'));
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

            form.get('cost.price').setValue(99);

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

            form.get('time').setValue(120);

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
                vGroup({ abc: vTaxModel }),
            ).keyGenerator(keyGenerator).build(false);

            expect(keyGenerator).not.toHaveBeenCalled();
        });

        it('key generator generates key for each restored control', () => {
            const keyGenerator = jasmine.createSpy().and.returnValues([1, 2, 3, 4, 5]);
            const form = vForm<boolean>((flag) =>
                vGroup(flag
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
            expect(getLastFormNode(form.get('tax')!).key).toBe(1);
            expect(getLastFormNode(form.get('tax.tax1')!).key).toBe(2);
            expect(getLastFormNode(form.get('tax.tax2')!).key).toBe(3);
            expect(getLastFormNode(form.get('tax.tax2.0')!).key).toBe(4);
            expect(getLastFormNode(form.get('tax.tax2.1')!).key).toBe(5);
            
        });
    });

    describe('valueChanges', () => {
        it('should emit value once for each reconcile operation', () => {
            const subscriber = jasmine.createSpy('subscriber')
            const rawSubscriber = jasmine.createSpy('raw-subscriber')

            const form = vForm((value: Box) => vGroup({
                name: vControl(),
                weight: vControl({
                    disabled: value.volume! > 100,
                    validator: value.name === 'mouse' ? VValidators.max(10) : VValidators.max(10000),
                }),
                volume: vControl({
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
            const form = vForm(() => vGroup({
                nested: vGroup({
                    arr: vArray([
                        vControl(),
                        vGroup({
                            field: vControl({ value: 'abc' }),
                        }),
                    ]),
                }),
            })).build({});

            expect(form.get('nested.arr.1.field').value).toBe('abc');
            expect(() => form.get('a.b.c.0')).toThrowError(errorHasMessage('a.b.c.0'));
            expect(() => form.get('unexisting')).toThrowError(errorHasMessage('unexisting'));
            expect(() => form.get('0')).toThrowError(errorHasMessage('0'));
            expect(() => form.get('nested.arr.1.field2')).toThrowError(errorHasMessage('nested.arr.1.field2'));
        });

        it('"array reconcilation" should throw error if several items have the same key', () => {
            const form = vForm(() => vGroup({
                group: vGroup({
                    nested: vArray([
                        vControl({ key: 'abracadabra' }),
                        vControl({ key: 'abracadabra' }),
                    ]),
                }),
            })).build({});
            
            expect(() => form.update()).toThrowError(errorHasMessage('abracadabra', 'group.nested.{0, 1}'));
        });

        it('"render operation" should throw error if type of vnode is unknown', () => {
            expect(() => vForm(() => vGroup({
                group: vGroup({
                    nested: vArray([
                        vControl({ key: 1 }),
                        { type: 100 } as any,
                        vControl({ key: 2 }),
                    ]),
                }),
            })).build({})).toThrowError(errorHasMessage('group.nested.1'));
        });

        it('"reconcilation of VFormControl" should throw error if type of vnode is different', () => {
            const form = vForm<boolean>((flag: boolean) => vGroup({
                group: vGroup({
                    nested: vArray([
                        vControl({ key: 1 }),
                        flag ? vGroup({ key: 2 }, {}) : vControl({ key: 2 }),
                        vControl({ key: 3 }),
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
            const form = vForm<boolean>((flag: boolean) => vGroup({
                group: vGroup({
                    nested: vArray([
                        vControl({ key: 1 }),
                        flag ? vArray({ key: 2 }, []) : vGroup({ key: 2 }, {}),
                        vControl({ key: 3 }),
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
            const form = vForm<boolean>((flag: boolean) => vGroup({
                group: vGroup({
                    nested: vArray([
                        vControl({ key: 1 }),
                        flag ? vControl({ key: 2 }) : vArray({ key: 2 }, []),
                        vControl({ key: 3 }),
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
            const form = vForm(() => vControl({ required: true }))
                .validationStrategy(123 as any)
                .build(1);

            expect(() => form.update()).toThrowError();
        });

        it('"reconcilation operation" should throw error if unmanaged control is found in strict mode', () => {
            const form = vForm(() => vGroup({
                group: vGroup({
                    nested: vArray([
                        vControl({ key: 'abracadabra' }),
                        vControl({ key: 'abracadabra' }),
                    ]),
                }),
            })).build({});

            const array = form.get('group.nested') as FormArray;

            array.push(new FormControl());

            expect(() => form.update()).toThrowError(errorHasMessage('group.nested.2'));
        });

        it('"render operation" should throw error if root node is nil', () => {
            expect(() => vForm(() => null as any).build(1)).toThrowError();
        });

        it('"render operation" should throw error if root node is a placeholder', () => {
            expect(() => vForm(() => vSkip() as any).build(1)).toThrowError();
        });

        it('"render operation" should throw error if root node is a portal', () => {
            expect(() => vForm(() => vPortal('name') as any).build(1)).toThrowError();
        });

        it('"reconcilation operation" should throw error if root node is nil', () => {
            const form = vForm((n: number) => n < 0 ? null as any : vControl()).build(1 as number);

            expect(() => form.setValue(-1)).toThrowError();
        });

        it('"render operation" should throw error if child of group is nil', () => {
            expect(() => vForm(() => vGroup({
                group: vGroup({
                    nested: null as any,
                }),
            })).build(false)).toThrowError(errorHasMessage('group.nested'));
        });

        it('"reconcilation operation" should throw error if child of group is nil', () => {
            const form = vForm<boolean>((flag: boolean) => vGroup({
                group: vGroup({
                    nested: flag ? null as any : vControl({ key: 2 }),
                }),
            })).build(false as boolean);

            expect(() => form.setValue(true)).toThrowError(errorHasMessage('group.nested'));
        });

        it('"render operation" should throw error if child of array is nil', () => {
            expect(() => vForm(() => vGroup({
                group: vGroup({
                    nested: vArray([
                        vControl({ key: 1 }),
                        null as any,
                        vControl({ key: 3 }),
                    ]),
                }),
            })).build(false)).toThrowError(errorHasMessage('group.nested.1'));
        });

        it('"reconcilation operation" should throw error if child of array is nil', () => {
            const form = vForm<boolean>((flag: boolean) => vGroup({
                group: vGroup({
                    nested: vArray([
                        vControl({ key: 1 }),
                        flag ? null as any : vControl({ key: 2 }),
                        vControl({ key: 3 }),
                    ]),
                }),
            })).build(false as boolean);

            expect(() => form.setValue(true)).toThrowError(errorHasMessage('group.nested.1'));
        });

        it('"render operation" should throw error if native control is rendered into nil', () => {
            expect(() => vForm(() => vNative()).build(1)).toThrowError()
        });

        it('"reconcilation operation" should throw error if native control is rendered into nil', () => {
            const control = new FormControl();
            const form = vForm((flag: boolean) => vNative(flag ? undefined : control)).build(false as boolean);

            expect(() => form.setValue(true)).toThrowError()
        });
    });

    describe('console messages', () => {
        let warn: jasmine.Spy<typeof console['warn']>;

        beforeEach(() => {
            warn = spyOn(console, 'warn');
        });

        it('"array reconcilation" should print warning if item does not have a key', () => {
            const form = vForm(() => vGroup({
                group: vGroup({
                    nested: vArray([
                        vControl({ key: 1 }),
                        vControl(),
                        vControl({ key: 3 }),
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
