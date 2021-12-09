import { FormArray, FormControl, FormGroup } from '@angular/forms';
import { wArray, wControl, wGroup, wNative, wPortal, wSkip } from '../basic';
import { wForm } from '../builder';
import { WFormNodeType } from '../model';
import { dataChanges, getData, getLastFormNode } from '../reconcilation';
import { WValidators } from '../validators';
import { belarusToAustralia, belarusToRussia, Box, createFlightForm, createFlightWNode, createTaxControl, elephant, Flight, mouse, russiaToBelarus, vTaxModel, vTaxModelWithKeys } from './test-mocks';

const flightFactory = (value: Flight) => wGroup({
    name: wControl(),
    route: wArray(value.route.map(() => wControl())),
    cost: wGroup({
        price: wControl(),
        discount: wControl(),
    }),
    time: wControl({ disabled: true }),
});

function errorHasMessage(...strs: string[]): RegExp {
    return new RegExp(strs.map(str => str.replace(/\.|\{\}/g, ch => `\\${ch}`)).join('(.|\n)*'), 'm');
}

describe('basic', () => {
    describe('virtual function', () => {
        it('should accept initial value', () => {
            const fn = jasmine.createSpy('virtual-fn').and.returnValue(wControl());
            wForm(fn).build(1);
    
            expect(fn.calls.count()).toBe(1);
            expect(fn.calls.mostRecent().args[0]).toBe(1);
        });
    
        it('should accept value passed into "setValue" method', () => {
            const fn = jasmine.createSpy('virtual-fn').and.callFake(wControl);
            const form = wForm(fn).build(1);
    
            form.setValue(5);
    
            expect(fn.calls.count()).toBe(2);
            expect(fn.calls.mostRecent().args[0]).toBe(5);
        });
    
        it('should accept current value if "update" is called', () => {
            const fn = jasmine.createSpy('virtual-fn').and.callFake(wControl);
            const form = wForm(fn).build(1);
    
            form.update();
    
            expect(fn.calls.count()).toBe(2);
            expect(fn.calls.mostRecent().args[0]).toBe(1);
        });
    
        it('should not be called if value was changed using "control.setValue"', () => {
            const fn = jasmine.createSpy('virtual-fn').and.callFake(wControl);
            const form = wForm(fn).build(1);
    
            form.control.setValue(5);
    
            expect(fn.calls.count()).toBe(1);
            expect(fn.calls.mostRecent().args[0]).toBe(1);
        });
    });

    describe('setValue', () => {
        it('should pass value into virtual function', () => {
            const fn = jasmine.createSpy('virtual-fn').and.callFake(wControl);
            const form = wForm(fn).build(1);
    
            form.setValue(5);
    
            expect(fn.calls.mostRecent().args[0]).toBe(5);
        });
        it('should pass value transformed by value function into virtual function', () => {
            const fn = jasmine.createSpy('virtual-fn').and.callFake(wControl);
            const form = wForm(fn).build(2);
    
            form.setValue(value => value + 1);
    
            expect(fn.calls.mostRecent().args[0]).toBe(3);
        });
    });

    describe('attach', () => {
        it('should attach existing reactive form to wform', () => {
            const control = createFlightForm(belarusToRussia);

            const form = wForm(createFlightWNode).attach(control);

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

            const form = wForm(createFlightWNode).attach(control);

            const group = form.control as FormGroup;

            group.setControl('tax', new FormControl(123));

            expect(() => form.update()).toThrowError(errorHasMessage('strict'));
        });
    });

    describe('updateOnChange', () => {
        it('should update form as soon as some value has changed', () => {
            const factory = jasmine.createSpy('virtual-fn').and.callFake(flightFactory);

            const form = wForm(factory)
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

            const form = wForm(factory)
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
            wForm(() =>
                wGroup({ abc: vTaxModel }),
            ).keyGenerator(keyGenerator).build({ abc: { tax1: 1, tax2: [3, 4] } });

            expect(keyGenerator).not.toHaveBeenCalled();
        });

        it('key generator generates key for each restored control', () => {
            const keyGenerator = jasmine.createSpy().and.returnValues([1, 2, 3, 4, 5]);
            const form = wForm<boolean>((flag) =>
                wGroup(flag
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

            const form = wForm((value: Box) => wGroup({
                name: wControl(),
                weight: wControl({
                    disabled: value.volume! > 100,
                    validator: value.name === 'mouse' ? WValidators.max(10) : WValidators.max(10000),
                }),
                volume: wControl({
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
        it('"group" should throw error if control is not FormGroup', () => {
            const form = wForm(() => wControl()).build(1);

            expect(() => form.group).toThrowError(errorHasMessage('Root', 'FormGroup'));
        });

        it('"array" should throw error if control is not FormArray', () => {
            const form = wForm(() => wControl()).build(1);

            expect(() => form.array).toThrowError(errorHasMessage('Root', 'FormArray'));
        });

        it('"get" should throw error if control does not exist', () => {
            const form = wForm(() => wGroup({
                nested: wGroup({
                    arr: wArray([
                        wControl(),
                        wGroup({
                            field: wControl({ value: 'abc' }),
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

        it('"getGroup" should throw error if control is not FormGroup', () => {
            const form = wForm(() => wGroup({
                nested: wGroup({
                    arr: wArray([
                        wControl(),
                        wGroup({
                            field: wControl({ value: 'abc' }),
                        }),
                    ]),
                }),
            })).build({});

            expect(form.getGroup('nested').value).toBeTruthy();
            expect(() => form.getGroup('nested.arr')).toThrowError(errorHasMessage('FormGroup', 'nested.arr'));
            expect(() => form.getGroup('nested.arr.0')).toThrowError(errorHasMessage('FormGroup', 'nested.arr.0'));
        });

        it('"getArray" should throw error if control is not FormArray', () => {
            const form = wForm(() => wGroup({
                nested: wGroup({
                    arr: wArray([
                        wControl(),
                        wGroup({
                            field: wControl({ value: 'abc' }),
                        }),
                    ]),
                }),
            })).build({});

            expect(form.getArray('nested.arr').value).toBeTruthy();
            expect(() => form.getArray('nested')).toThrowError(errorHasMessage('FormArray', 'nested'));
            expect(() => form.getArray('nested.arr.0')).toThrowError(errorHasMessage('FormArray', 'nested.arr.0'));
        });

        it('"array reconcilation" should throw error if several items have the same key', () => {
            const form = wForm(() => wGroup({
                group: wGroup({
                    nested: wArray([
                        wControl({ key: 'abracadabra' }),
                        wControl({ key: 'abracadabra' }),
                    ]),
                }),
            })).build({});
            
            expect(() => form.update()).toThrowError(errorHasMessage('abracadabra', 'group.nested.{0, 1}'));
        });

        it('"render operation" should throw error if type of wnode is unknown', () => {
            expect(() => wForm(() => wGroup({
                group: wGroup({
                    nested: wArray([
                        wControl({ key: 1 }),
                        { type: 100 },
                        wControl({ key: 2 }),
                    ]),
                }),
            })).build({})).toThrowError(errorHasMessage('group.nested.1'));
        });

        it('"reconcilation of WFormControl" should throw error if type of wnode is different', () => {
            const form = wForm<boolean>((flag: boolean) => wGroup({
                group: wGroup({
                    nested: wArray([
                        wControl({ key: 1 }),
                        flag ? wGroup({ key: 2 }, {}) : wControl({ key: 2 }),
                        wControl({ key: 3 }),
                    ]),
                }),
            })).build(false as boolean);

            expect(() => form.setValue(true)).toThrowError(errorHasMessage(
                'group.nested.1',
                `requestedType = ${WFormNodeType[WFormNodeType.Group]}`,
                'control = FormControl',
            ));
        });

        it('"reconcilation of WFormGroup" should throw error if type of wnode is different', () => {
            const form = wForm<boolean>((flag: boolean) => wGroup({
                group: wGroup({
                    nested: wArray([
                        wControl({ key: 1 }),
                        flag ? wArray({ key: 2 }, []) : wGroup({ key: 2 }, {}),
                        wControl({ key: 3 }),
                    ]),
                }),
            })).build(false as boolean);

            expect(() => form.setValue(true)).toThrowError(errorHasMessage(
                'group.nested.1',
                `requestedType = ${WFormNodeType[WFormNodeType.Array]}`,
                'control = FormGroup',
            ));
        });

        it('"reconcilation of WFormArray" should throw error if type of wnode is different', () => {
            const form = wForm<boolean>((flag: boolean) => wGroup({
                group: wGroup({
                    nested: wArray([
                        wControl({ key: 1 }),
                        flag ? wControl({ key: 2 }) : wArray({ key: 2 }, []),
                        wControl({ key: 3 }),
                    ]),
                }),
            })).build(false as boolean);

            expect(() => form.setValue(true)).toThrowError(errorHasMessage(
                'group.nested.1',
                `requestedType = ${WFormNodeType[WFormNodeType.Control]}`,
                'control = FormArray',
            ));
        });

        it('"getLastFormNode" should throw error if control was never rendered', () => {
            expect(() => getLastFormNode(new FormControl())).toThrowError();
        });

        it('"render operation" should throw error if validation strategy is unknown', () => {
            const form = wForm(() => wControl({ required: true }))
                .validationStrategy(123 as any)
                .build(1);

            expect(() => form.update()).toThrowError();
        });

        it('"reconcilation operation" should throw error if unmanaged control is found in strict mode', () => {
            const form = wForm(() => wGroup({
                group: wGroup({
                    nested: wArray([
                        wControl({ key: 'abracadabra' }),
                        wControl({ key: 'abracadabra' }),
                    ]),
                }),
            })).build({});

            const array = form.get('group.nested') as FormArray;

            array.push(new FormControl());

            expect(() => form.update()).toThrowError(errorHasMessage('group.nested.2'));
        });

        it('"render operation" should throw error if root node is nil', () => {
            expect(() => wForm(() => null as any).build(1)).toThrowError();
        });

        it('"render operation" should throw error if root node is a placeholder', () => {
            expect(() => wForm(() => wSkip() as any).build(1)).toThrowError();
        });

        it('"render operation" should throw error if root node is a portal', () => {
            expect(() => wForm(() => wPortal('name')).build(1)).toThrowError();
        });

        it('"reconcilation operation" should throw error if root node is nil', () => {
            const form = wForm((n: number) => n < 0 ? null as any : wControl()).build(1 as number);

            expect(() => form.setValue(-1)).toThrowError();
        });

        it('"render operation" should throw error if child of group is nil', () => {
            expect(() => wForm(() => wGroup({
                group: wGroup({
                    nested: null as any,
                }),
            })).build({})).toThrowError(errorHasMessage('group.nested'));
        });

        it('"reconcilation operation" should throw error if child of group is nil', () => {
            const form = wForm<boolean>((flag: boolean) => wGroup({
                group: wGroup({
                    nested: flag ? null as any : wControl({ key: 2 }),
                }),
            })).build(false as boolean);

            expect(() => form.setValue(true)).toThrowError(errorHasMessage('group.nested'));
        });

        it('"render operation" should throw error if child of array is nil', () => {
            expect(() => wForm(() => wGroup({
                group: wGroup({
                    nested: wArray([
                        wControl({ key: 1 }),
                        null as any,
                        wControl({ key: 3 }),
                    ]),
                }),
            })).build({})).toThrowError(errorHasMessage('group.nested.1'));
        });

        it('"reconcilation operation" should throw error if child of array is nil', () => {
            const form = wForm<boolean>((flag: boolean) => wGroup({
                group: wGroup({
                    nested: wArray([
                        wControl({ key: 1 }),
                        flag ? null as any : wControl({ key: 2 }),
                        wControl({ key: 3 }),
                    ]),
                }),
            })).build(false as boolean);

            expect(() => form.setValue(true)).toThrowError(errorHasMessage('group.nested.1'));
        });

        it('"render operation" should throw error if native control is rendered into nil', () => {
            expect(() => wForm(() => wNative()).build(1)).toThrowError()
        });

        it('"reconcilation operation" should throw error if native control is rendered into nil', () => {
            const control = new FormControl();
            const form = wForm((flag: boolean) => wNative(flag ? undefined : control)).build(false as boolean);

            expect(() => form.setValue(true)).toThrowError()
        });
    });

    describe('data', () => {
        it('"getData" should return rendered data', () => {
            const form = wForm((value: number) => wControl({ data: { value12: value + 12 } })).build(3);

            expect(getData(form.control)).toEqual({ value12: 15 });
        });

        it('"getData" should return last rendered data', () => {
            const form = wForm((value: number) => wControl({ data: { value12: value + 12 } })).build(3);

            form.setValue(7);

            expect(getData(form.control)).toEqual({ value12: 19 });

            form.setValue(17);

            expect(getData(form.control)).toEqual({ value12: 29 });
        });

        it('"dataChanges" should stream data changes', () => {
            const form = wForm((value: number) => wControl({ data: { value12: value + 12 } })).build(3);

            const subscription = jasmine.createSpy();
            dataChanges(form.control).subscribe(subscription);

            form.setValue(7);

            expect(subscription.calls.mostRecent().args[0]).toEqual({ value12: 19 });

            form.setValue(17);

            expect(subscription.calls.mostRecent().args[0]).toEqual({ value12: 29 });
        });
    });

    describe('console messages', () => {
        let warn: jasmine.Spy<typeof console['warn']>;

        beforeEach(() => {
            warn = spyOn(console, 'warn');
        });

        it('"array reconcilation" should print warning if item does not have a key', () => {
            const form = wForm(() => wGroup({
                group: wGroup({
                    nested: wArray([
                        wControl({ key: 1 }),
                        wControl(),
                        wControl({ key: 3 }),
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
