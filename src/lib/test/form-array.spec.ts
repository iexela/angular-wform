import { fakeAsync, tick } from '@angular/core/testing';
import { FormArray, FormControl } from '@angular/forms';
import { getLastFormNode, vArray, vControl, VForm, vForm, VFormArrayChildren, VFormArrayOptions, VFormBuilder, VFormControlOptions, VFormHooks, vGroup, vValidator } from '..';
import { vNative, vSkip } from '../basic';
import { vValidatorAsync } from '../validators';
import { Box, createTaxControl, elephant, even, krokodile, moreThan10, mouse, taxData, vTaxModel } from './test-mocks';
import { andTick, trackControl } from './test-utils';

function defaultItemRenderer<T>(value: T, index: number): VFormControlOptions {
    return { key: index, value };
}

function withItem<T>(items: T[], fn: (value: T, index: number) => VFormControlOptions = defaultItemRenderer): VFormArrayChildren {
    return (items || []).map((item, index) => vControl(fn(item, index)));
}

const fibonaci5 = [0, 1, 1, 2, 3];
const fibonaci10 = [0, 1, 1, 2, 3, 5, 8, 13, 21, 34];

const fibonaci2_5 = [1, 2, 3, 5, 8];
const fibonaci2_10 = [1, 2, 3, 5, 8, 13, 21, 34, 55, 89];

const lengthLessThan10 = vValidator(control => control.value.length >= 10 ? { length: true } : null);
const startedFrom0 = vValidator(control => control.value[0] !== 0 ? { zero: true } : null);

const lengthLessThan10Async = vValidatorAsync(control => Promise.resolve(control.value.length >= 10 ? { length: true } : null));
const startedFrom0Async = vValidatorAsync(control => Promise.resolve(control.value[0] !== 0 ? { zero: true } : null));

function renderArray(initial: number[], options: VFormArrayOptions = {}, children?: VFormArrayChildren): VForm<number[]> {
    return vForm((current: number[]) => vArray(options, children || withItem(current))).lenient().build(initial);
}

function renderConditionalArray(initial: number[],
                                anchor: number,
                                [optionsLess, childrenLess]: [VFormArrayOptions, VFormArrayChildren?],
                                [optionsMore, childrenMore]: [VFormArrayOptions, VFormArrayChildren?]): VForm<number[]> {
    return vForm((value: number[]) => {
        const isLess = value.every(v => v < anchor);
        return vArray(isLess ? optionsLess : optionsMore, (isLess ? childrenLess : childrenMore) || withItem(value));
    }).lenient().build(initial);
}

function renderDisabledConditionalGroup(initial: number[], anchor: number): VForm<number[]> {
    return renderConditionalArray(initial, anchor, [{ disabled: true }], [{ disabled: false }]);
}

function boxArrayFormBuilder(): VFormBuilder<Box[]> {
    return vForm((boxes: Box[]) => vArray(boxes.map(box => vGroup({ key: box.name }, {
        name: vControl(),
        weight: vControl(),
        volume: vControl(),
    }))));
}

function boxArrayFormBuilderWithoutKeys(): VFormBuilder<Box[]> {
    return vForm((boxes: Box[]) => vArray(boxes.map(box => vGroup({
        name: vControl(),
        weight: vControl(),
        volume: vControl(),
    }))));
}

describe('VFormArray', () => {
    describe('first render', () => {
        it('should render control', () => {
            expect(renderArray(fibonaci5).control).toBeTruthy();
        });
    
        it('should render enabled control, by default', () => {
            expect(renderArray(fibonaci5).control.disabled).toBeFalse();
        });
    
        it('should render disabled control if "disabled" flag is set to "true"', () => {
            expect(renderArray(fibonaci5, { disabled: true }).control.disabled).toBeTrue();
        });
    
        it('should render enabled control if "disabled" flag is set to "false"', () => {
            expect(renderArray(fibonaci5, { disabled: false }).control.disabled).toBeFalse();
        });

        it('should enable all internal controls, by default', () => {
            const form = renderArray(fibonaci5, {}, withItem(fibonaci5));

            expect(form.getControl('0').disabled).toBeFalse();
            expect(form.getControl('1').disabled).toBeFalse();
        });

        it('should disable all internal controls if "disabled" is true', () => {
            const form = renderArray(fibonaci5, {
                disabled: true,
            }, withItem(fibonaci5));

            expect(form.getControl('0').disabled).toBeTrue();
            expect(form.getControl('1').disabled).toBeTrue();
        });

        it('should disable all internal controls if "disabled" is true (regardless internal controls disabled flag)', () => {
            const form = renderArray(fibonaci5, {
                disabled: true,
            }, withItem(fibonaci5, () => ({ disabled: false })));

            expect(form.getControl('0').disabled).toBeTrue();
            expect(form.getControl('1').disabled).toBeTrue();
        });

        it('should leave "disabled" state for internal controls as they desire when "disabled" is false', () => {
            const form = renderArray(fibonaci5, {
                disabled: false,
            }, withItem(fibonaci5, (_, i) => ({ disabled: (i % 2) === 0 })));

            expect(form.getControl('0').disabled).toBeTrue();
            expect(form.getControl('1').disabled).toBeFalse();
        });

        describe('validator', () => {
            it('should not assign any validators by default', () => {
                expect(renderArray(fibonaci5).control.validator).toBeFalsy();
            });
    
            it('should assign provided validator', () => {
                const options = { validator: lengthLessThan10 };
                expect(renderArray(fibonaci10, options).control.errors).toEqual({ length: true });
                expect(renderArray(fibonaci5, options).control.errors).toBeFalsy();
            });
    
            it('should return merged validation result', () => {
                const options = { validator: [lengthLessThan10, startedFrom0] };
                expect(renderArray(fibonaci2_10, options).control.errors).toEqual({ zero: true, length: true });
                expect(renderArray(fibonaci2_5, options).control.errors).toEqual({ zero: true });
                expect(renderArray(fibonaci10, options).control.errors).toEqual({ length: true });
                expect(renderArray(fibonaci5, options).control.errors).toBeFalsy();
            });
    
            it('should not validate disabled control', () => {
                expect(renderArray(fibonaci10, { validator: lengthLessThan10, disabled: true }).control.errors).toBeFalsy();
            });
        });

        describe('async validator', () => {
            it('should not assign any async validators by default', () => {
                expect(renderArray(fibonaci5).control.asyncValidator).toBeFalsy();
            });
    
            it('should assign provided async validator', fakeAsync(() => {
                const options = { asyncValidator: lengthLessThan10Async };
                expect(andTick(renderArray(fibonaci10, options)).control.errors).toEqual({ length: true });
                expect(andTick(renderArray(fibonaci5, options).control.errors)).toBeFalsy();
            }));
    
            it('should return merged async validation result', fakeAsync(() => {
                const options = { asyncValidator: [lengthLessThan10Async, startedFrom0Async] };
                expect(andTick(renderArray(fibonaci2_10, options)).control.errors).toEqual({ zero: true, length: true });
                expect(andTick(renderArray(fibonaci2_5, options)).control.errors).toEqual({ zero: true });
                expect(andTick(renderArray(fibonaci10, options)).control.errors).toEqual({ length: true });
                expect(andTick(renderArray(fibonaci5, options)).control.errors).toBeFalsy();
            }));
    
            it('should not run async validator for disabled control', fakeAsync(() => {
                expect(andTick(renderArray(fibonaci10, { asyncValidator: lengthLessThan10Async, disabled: true })).control.errors).toBeFalsy();
            }));
        });

        it('should allow both sync and async validators', fakeAsync(() => {
            const options = { validator: lengthLessThan10, asyncValidator: startedFrom0Async };
            expect(andTick(renderArray(fibonaci2_10, options)).control.errors).toEqual({ length: true });
            expect(andTick(renderArray(fibonaci2_5, options)).control.errors).toEqual({ zero: true });
            expect(andTick(renderArray(fibonaci10, options)).control.errors).toEqual({ length: true });
            expect(andTick(renderArray(fibonaci5, options)).control.errors).toBeFalsy();
        }));

        it('should not mark control as dirty if corresponding tiny flag is not set', () => {
            const form = renderArray(fibonaci5, {});

            expect(form.control.dirty).toBeFalse();
        });

        it('should not mark control as dirty if corresponding tiny flag is set to false', () => {
            const form = renderArray(fibonaci5, { dirty: false });

            expect(form.control.dirty).toBeFalse();
        });

        it('should mark control as dirty if corresponding tiny flag is set to true', () => {
            const form = renderArray(fibonaci5, { dirty: true });

            expect(form.control.dirty).toBeTrue();
        });

        it('should not mark control as touched if corresponding tiny flag is not set', () => {
            const form = renderArray(fibonaci5, {});

            expect(form.control.touched).toBeFalse();
        });

        it('should not mark control as touched if corresponding tiny flag is set to false', () => {
            const form = renderArray(fibonaci5, { touched: false });

            expect(form.control.touched).toBeFalse();
        });

        it('should mark control as touched if corresponding tiny flag is set to true', () => {
            const form = renderArray(fibonaci5, { touched: true });

            expect(form.control.touched).toBeTrue();
        });

        it('should not render skipped control', () => {
            const form = vForm((numbers: number[]) => vArray([
                vSkip(),
                vControl({ key: 1, value: numbers[0] }),
                vControl({ key: 2, value: numbers[1] }),
            ])).build([10, 20]);

            const array = form.control as FormArray;
            expect(form.value as any).toEqual([10, 20]);
            expect(array.length).toBe(2);
        });

        it('should not render native control, if it is not bound', () => {
            const form = vForm((numbers: number[]) => vArray([
                vNative(),
                vControl({ key: 1, value: numbers[0] }),
                vControl({ key: 2, value: numbers[1] }),
            ])).build([10, 20]);

            const array = form.control as FormArray;
            expect(form.value as any).toEqual([10, 20]);
            expect(array.length).toBe(2);
        });

        it('should render native control, if it is bound', () => {
            const control = new FormControl(999);
            const form = vForm((numbers: number[]) => vArray([
                vNative(control, { key: 999, value: control.value }),
                vControl({ key: 1, value: numbers[0] }),
                vControl({ key: 2, value: numbers[1] }),
            ])).build([10, 20]);

            const array = form.control as FormArray;
            expect(form.value as any).toEqual([999, 10, 20]);
            expect(array.length).toBe(3);
        });

        it('should set updateOn flag to "change", by default', () => {
            const form = renderArray(fibonaci5, {});

            expect(form.control.updateOn).toBe(VFormHooks.Change);
            expect(form.getControl('1').updateOn).toBe(VFormHooks.Change);
        });

        it('should allow to set updateOn flag', () => {
            const form = renderArray(fibonaci5, { updateOn: VFormHooks.Blur });

            expect(form.control.updateOn).toBe(VFormHooks.Blur);
            expect(form.getControl('1').updateOn).toBe(VFormHooks.Blur);
        });

        it('should allow to redeclare updateOn flag on child level', () => {
            const form = renderArray(
                fibonaci5,
                { updateOn: VFormHooks.Blur },
                withItem(fibonaci5, (_, i) => (i === 1 ? { updateOn: VFormHooks.Submit } : {})));

            expect(form.control.updateOn).toBe(VFormHooks.Blur);
            expect(form.getControl('0').updateOn).toBe(VFormHooks.Blur);
            expect(form.getControl('1').updateOn).toBe(VFormHooks.Submit);
        });
    });

    describe('value getters', () => {
        it('should render provided value', () => {
            expect(renderArray(fibonaci5).value).toEqual(fibonaci5);
        });
    
        it('should return only fields mapped to controls', () => {
            const form = vForm(() => vArray(withItem(fibonaci5))).build(fibonaci10);

            expect(form.value).toEqual(fibonaci5);
        });
    
        it('should return all fields mapped to controls', () => {
            const form = vForm(() => vArray(withItem(fibonaci10))).build(fibonaci5);

            expect(form.value).toEqual(fibonaci10);
        });
    
        it('should return value if "disabled"', () => {
            expect(renderArray(fibonaci5, { disabled: true }).value).toEqual(fibonaci5);
        });
    
        it('should return value without disabled controls', () => {
            expect(renderArray(fibonaci10, {}, withItem(fibonaci10, (_, i) => ({ disabled: (i % 2) === 0 }))).value).toEqual([1, 2, 5, 13, 34]);
        });
    
        it('should return rawValue', () => {
            expect(renderArray(fibonaci10).rawValue).toEqual(fibonaci10);
        });
    
        it('should return rawValue if "disabled"', () => {
            expect(renderArray(fibonaci10, { disabled: true }).rawValue).toEqual(fibonaci10);
        });
    
        it('should return rawvalue regardless disabled controls', () => {
            expect(renderArray(
                fibonaci10,
                {},
                withItem(fibonaci10, (_, i) => ({ disabled: (i % 2) === 0 })),
            ).rawValue).toEqual(fibonaci10);
        });
    });

    describe('setValue', () => {
        it('should update control if it is called with different value', () => {
            const form = renderArray(fibonaci5);
    
            const tracker = trackControl(form.control);

            form.setValue(fibonaci2_5);
    
            expect(form.value).toEqual(fibonaci2_5);
            expect(tracker.changed).toBeTrue();
        });
    
        it('should not update control if value was not changed', () => {
            const form = renderArray(fibonaci5);
    
            const tracker = trackControl(form.control);
    
            form.setValue([ ...fibonaci5 ]);
    
            expect(tracker.changed).toBeFalse();
        });
    
        it('should not update control if unrelated field was added', () => {
            const form = renderArray(fibonaci5, {}, withItem(fibonaci5));
    
            const tracker = trackControl(form.control);
    
            form.setValue(fibonaci10);
    
            expect(tracker.changed).toBeFalse();
        });
    });

    describe('update', () => {
        it('should do nothing if it is called without changing a value', () => {
            const form = renderArray(fibonaci5);
    
            const tracker = trackControl(form.control);
    
            form.update();
    
            expect(tracker.changed).toBeFalse();
        });

        it('should do nothing if only value was changed', () => {
            const form = renderArray(fibonaci5);

            form.control.setValue(fibonaci2_5);
    
            const tracker = trackControl(form.control);

            form.update();
    
            expect(tracker.changed).toBeFalse();
        });

        it('should do nothing if value of child control was changed', () => {
            const form = renderArray(fibonaci5);

            form.control.get('2')!.setValue(fibonaci5[2] + 500);
    
            const tracker = trackControl(form.control);

            form.update();
    
            expect(tracker.changed).toBeFalse();
        });
    });

    describe('reconcilation', () => {
        it('should switch state of control from enabled to disabled', () => {
            const form = renderDisabledConditionalGroup(fibonaci10, 20);
    
            expect(form.control.disabled).toBeFalse();
    
            form.setValue(fibonaci5);
    
            expect(form.control.disabled).toBeTrue();
            expect(form.getControl('0').disabled).toBeTrue();
            expect(form.getControl('1').disabled).toBeTrue();
        });

        it('should switch state of control from disabled to enabled', () => {
            const form = renderDisabledConditionalGroup(fibonaci5, 20);
    
            expect(form.control.disabled).toBeTrue();
    
            form.setValue(fibonaci10);
    
            expect(form.control.disabled).toBeFalse();
            expect(form.getControl('0').disabled).toBeFalse();
            expect(form.getControl('1').disabled).toBeFalse();
        });

        it('should do nothing if disabled flag was not modified in vform tree', () => {
            const form = vForm(() => vArray({ disabled: true }, withItem(fibonaci5))).build(fibonaci5);
    
            const tracker = trackControl(form.control);
    
            form.update();
    
            expect(tracker.changed).toBeFalse();
        });

        it('should disable internal controls if "disabled" flag was switched to true (regardles of "disabled" flag of internal controls)', () => {
            const form = renderConditionalArray(
                fibonaci2_10,
                50,
                [
                    { disabled: true },
                    withItem(fibonaci10, (_, i) => ({ key: i, disabled: i % 2 === 0 })),
                ],
                [
                    { disabled: false },
                    withItem(fibonaci10, (_, i) => ({ key: i, disabled: i % 2 === 1 })),
                ]);
    
            expect(form.control.disabled).toBeFalse();
    
            form.setValue(fibonaci10);
    
            expect(form.control.disabled).toBeTrue();
            expect(form.getControl('0').disabled).toBeTrue();
            expect(form.getControl('1').disabled).toBeTrue();
        });

        it('should respect "disabled" state of internal controls if "disabled" flag was switched to false', () => {
            const form = renderConditionalArray(
                fibonaci10,
                50,
                [
                    { disabled: true },
                    withItem(fibonaci10, (_, i) => ({ key: i, disabled: i % 2 === 0 })),
                ],
                [
                    { disabled: false },
                    withItem(fibonaci2_10, (_, i) => ({ key: i, disabled: i % 2 === 1 })),
                ]);
    
            expect(form.control.disabled).toBeTrue();
    
            form.setValue(fibonaci2_10);
    
            expect(form.control.disabled).toBeFalse();
            expect(form.getControl('0').disabled).toBeFalse();
            expect(form.getControl('1').disabled).toBeTrue();
        });

        it('should switch state of internal controls (if any) if "disabled" flag is set to false', () => {
            const form = renderConditionalArray(
                fibonaci10,
                50,
                [
                    {},
                    withItem(fibonaci10, (_, i) => ({ key: i, disabled: i % 2 === 0 })),
                ],
                [
                    {},
                    withItem(fibonaci10, (_, i) => ({ key: i, disabled: i % 2 === 1 })),
                ]);
    
            expect(form.getControl('0').disabled).toBeTrue();
            expect(form.getControl('1').disabled).toBeFalse();
    
            form.setValue(fibonaci2_10);
    
            expect(form.getControl('0').disabled).toBeFalse();
            expect(form.getControl('1').disabled).toBeTrue();
        });

        describe('validator', () => {
            it('should assign validators', () => {
                const form = renderConditionalArray(fibonaci10, 50, [{}], [{ validator: startedFrom0 }]);
    
                expect(form.control.errors).toBeFalsy();
        
                form.setValue(fibonaci2_10);
    
                expect(form.control.errors).toEqual({ zero: true });
            });
    
            it('should remove validators', () => {
                const form = renderConditionalArray(fibonaci2_10, 50, [{}], [{ validator: startedFrom0 }]);
        
                expect(form.control.errors).toEqual({ zero: true });
        
                form.setValue(fibonaci10);
        
                expect(form.control.errors).toBeFalsy();
            });
    
            it('should change validators', () => {
                const form = renderConditionalArray(fibonaci10, 50, [{ validator: lengthLessThan10 }], [{ validator: [lengthLessThan10, startedFrom0] }]);
        
                expect(form.control.errors).toEqual({ length: true });
        
                form.setValue(fibonaci2_10);
        
                expect(form.control.errors).toEqual({ length: true, zero: true });
            });
    
            it('should rerender control if value was changed in meantime', () => {
                const form = renderConditionalArray(fibonaci10, 50, [{}], [{ validator: startedFrom0 }]);
        
                form.control.setValue(fibonaci2_10);
        
                expect(form.control.errors).toBeFalsy();
        
                form.update();
    
                expect(form.control.errors).toEqual({ zero: true });
            });
    
            it('should do nothing if validators were not changed', () => {
                const form = vForm(() => vArray({
                    validator: [lengthLessThan10, startedFrom0],
                }, withItem(fibonaci5))).build(fibonaci5);
        
                const tracker = trackControl(form.control);
        
                form.update();
        
                expect(tracker.changed).toBeFalse();
            });
        });

        describe('async validator', () => {
            it('should assign async validators', fakeAsync(() => {
                const form = renderConditionalArray(fibonaci10, 50, [{}], [{ asyncValidator: startedFrom0Async }]);
    
                tick();

                expect(form.control.errors).toBeFalsy();
        
                form.setValue(fibonaci2_10);

                tick();
    
                expect(form.control.errors).toEqual({ zero: true });
            }));
    
            it('should remove async validators', fakeAsync(() => {
                const form = renderConditionalArray(fibonaci2_10, 50, [{}], [{ asyncValidator: startedFrom0Async }]);
        
                tick();

                expect(form.control.errors).toEqual({ zero: true });
        
                form.setValue(fibonaci10);
        
                tick();

                expect(form.control.errors).toBeFalsy();
            }));
    
            it('should change async validators', fakeAsync(() => {
                const form = renderConditionalArray(fibonaci10, 50, [{ asyncValidator: lengthLessThan10Async }], [{ asyncValidator: [lengthLessThan10Async, startedFrom0Async] }]);
        
                tick();

                expect(form.control.errors).toEqual({ length: true });
        
                form.setValue(fibonaci2_10);
        
                tick();

                expect(form.control.errors).toEqual({ length: true, zero: true });
            }));
    
            it('should rerender control if value was changed in meantime', fakeAsync(() => {
                const form = renderConditionalArray(fibonaci10, 50, [{}], [{ asyncValidator: startedFrom0Async }]);
        
                form.control.setValue(fibonaci2_10);

                tick();
        
                expect(form.control.errors).toBeFalsy();
        
                form.update();

                tick();
    
                expect(form.control.errors).toEqual({ zero: true });
            }));
    
            it('should do nothing if async validators were not changed', fakeAsync(() => {
                const form = vForm(() => vArray({
                    asyncValidator: [lengthLessThan10Async, startedFrom0Async],
                }, withItem(fibonaci5))).build(fibonaci5);
        
                tick();
        
                const tracker = trackControl(form.control);
        
                form.update();

                tick();
        
                expect(tracker.changed).toBeFalse();
            }));
        });

        it('should not update dirty flag if corresponding tiny flag is not set', () => {
            const form = renderConditionalArray(fibonaci10, 50, [{}], [{}]);

            form.setValue(fibonaci2_10);

            expect(form.control.dirty).toBeFalse();

            form.control.markAsDirty();

            form.setValue(fibonaci2_10.concat([999]));

            expect(form.control.dirty).toBeTrue();
        });

        it('should unset dirty flag if corresponding tiny flag is set to false', () => {
            const form = renderConditionalArray(fibonaci10, 50, [{}], [{ dirty: false }]);

            form.setValue(fibonaci2_10);

            expect(form.control.dirty).toBeFalse();

            form.control.markAsDirty();

            form.setValue(fibonaci2_10.concat(999));

            expect(form.control.dirty).toBeFalse();
        });

        it('should mark control as dirty if corresponding tiny flag is set to true', () => {
            const form = renderConditionalArray(fibonaci10, 50, [{}], [{ dirty: true }]);

            form.setValue(fibonaci2_10);

            expect(form.control.dirty).toBeTrue();

            form.control.markAsPristine();

            form.setValue(fibonaci2_10.concat(999));

            expect(form.control.dirty).toBeTrue();
        });

        it('should not update touched flag if corresponding tiny flag is not set', () => {
            const form = renderConditionalArray(fibonaci10, 50, [{}], [{}]);

            form.setValue(fibonaci2_10);

            expect(form.control.touched).toBeFalse();

            form.control.markAsTouched();

            form.setValue(fibonaci2_10);

            expect(form.control.touched).toBeTrue();
        });

        it('should unset touched flag if corresponding tiny flag is set to false', () => {
            const form = renderConditionalArray(fibonaci10, 50, [{}], [{ touched: false }]);

            form.setValue(fibonaci2_10);

            expect(form.control.touched).toBeFalse();

            form.control.markAsTouched();

            form.setValue(fibonaci2_10.concat(999));

            expect(form.control.touched).toBeFalse();
        });

        it('should mark control as dirty if corresponding tiny flag is set to true', () => {
            const form = renderConditionalArray(fibonaci10, 50, [{}], [{ touched: true }]);

            form.setValue(fibonaci2_10);

            expect(form.control.touched).toBeTrue();

            form.control.markAsUntouched();

            form.setValue(fibonaci2_10.concat(999));

            expect(form.control.touched).toBeTrue();
        });
    
        it('should not recreate underlying FormControl', () => {
            const form = renderConditionalArray(fibonaci10, 50, [{ validator: startedFrom0 }], [{ validator: [lengthLessThan10, startedFrom0] }]);
    
            const control = form.control;
    
            form.setValue(fibonaci2_10);
    
            expect(form.control).toBe(control);
        });

        it('should append new control if it appears in the end of the vform description', () => {
            const form = boxArrayFormBuilder().build([krokodile, elephant]);

            const krokodileControl = form.getControl('0');
            const elephantControl = form.getControl('1');

            const newBoxes = [krokodile, elephant, mouse];

            form.setValue(newBoxes);

            expect(form.value).toEqual(newBoxes);
            expect(form.getControl('0')).toBe(krokodileControl);
            expect(form.getControl('1')).toBe(elephantControl);
            expect(form.getControl('2')).toBeTruthy();
        });

        it('should prepend new control if it appears in the beginning of the vform description', () => {
            const form = boxArrayFormBuilder().build([krokodile, elephant]);

            const krokodileControl = form.getControl('0');
            const elephantControl = form.getControl('1');

            const newBoxes = [mouse, krokodile, elephant];

            form.setValue(newBoxes);

            expect(form.value).toEqual(newBoxes);
            expect(form.getControl('0')).toBeTruthy();
            expect(form.getControl('1')).toBe(krokodileControl);
            expect(form.getControl('2')).toBe(elephantControl);
        });

        it('should insert new control if it appears in the middle of the vform description', () => {
            const form = boxArrayFormBuilder().build([krokodile, elephant]);

            const krokodileControl = form.getControl('0');
            const elephantControl = form.getControl('1');

            const newBoxes = [krokodile, mouse, elephant];

            form.setValue(newBoxes);

            expect(form.value).toEqual(newBoxes);
            expect(form.getControl('0')).toBe(krokodileControl);
            expect(form.getControl('1')).toBeTruthy();
            expect(form.getControl('2')).toBe(elephantControl);
        });

        it('should move controls if they positions were chnaged in the vform description', () => {
            const form = boxArrayFormBuilder().build([krokodile, elephant]);

            const krokodileControl = form.getControl('0');
            const elephantControl = form.getControl('1');

            const newBoxes = [elephant, mouse, krokodile];

            form.setValue(newBoxes);

            expect(form.value).toEqual(newBoxes);
            expect(form.getControl('0')).toBe(elephantControl);
            expect(form.getControl('1')).toBeTruthy();
            expect(form.getControl('2')).toBe(krokodileControl);
        });

        it('should remove control if it disappears from the vform description', () => {
            const form = boxArrayFormBuilder().build([krokodile, elephant]);

            const krokodileControl = form.getControl('0');
            const elephantControl = form.getControl('1');

            const newBoxes = [elephant, mouse];

            form.setValue(newBoxes);

            expect(form.value).toEqual(newBoxes);
            expect(form.getControl('0')).toBe(elephantControl);
            expect(form.getControl('1')).toBeTruthy();
            expect(form.getControl('1')).not.toBe(krokodileControl);
        });

        it('should update array controls by key if it is specified', () => {
            const form = boxArrayFormBuilder().build([krokodile, elephant]);

            const krokodileControl = form.getControl('0');
            const elephantControl = form.getControl('1');

            form.setValue([elephant, krokodile]);

            expect(krokodileControl.value).toEqual(krokodile);
            expect(elephantControl.value).toEqual(elephant);
        });

        it('should update array controls in order if key is not specified', () => {
            const form = boxArrayFormBuilderWithoutKeys().build([krokodile, elephant]);

            const krokodileControl = form.getControl('0');
            const elephantControl = form.getControl('1');

            form.setValue([elephant, krokodile]);

            expect(krokodileControl.value).toEqual(elephant);
            expect(elephantControl.value).toEqual(krokodile);
        });

        it('should add control if it is switched from vSkip', () => {
            const form = vForm((numbers: number[]) => vArray([
                numbers.some(n => n < 0) ? vSkip() : vControl({ key: 'sum', value: numbers[0] + numbers[1] }),
                vControl({ key: 1, value: numbers[0] }),
                vControl({ key: 2, value: numbers[1] }),
            ])).build([-10, -20]);

            const array = form.control as FormArray;

            expect(form.value).toEqual([-10, -20]);
            expect(array.length).toBe(2);
            
            form.setValue([10, 20]);
            
            expect(form.value).toEqual([30, 10, 20]);
            expect(array.length).toBe(3);
        });

        it('should remove control if it is switched to vSkip', () => {
            const form = vForm((numbers: number[]) => vArray([
                numbers.some(n => n < 0) ? vSkip() : vControl({ key: 'sum', value: numbers[0] + numbers[1] }),
                vControl({ key: 1, value: numbers[0] }),
                vControl({ key: 2, value: numbers[1] }),
            ])).build([10, 20]);

            const array = form.control as FormArray;
            
            expect(form.value).toEqual([30, 10, 20]);
            expect(array.length).toBe(3);
            
            form.setValue([-10, -20]);

            expect(form.value).toEqual([-10, -20]);
            expect(array.length).toBe(2);
        });

        it('should add native control, if it is switched to bind', () => {
            const control = new FormControl(999);
            const form = vForm((numbers: number[]) => vArray([
                vNative(numbers.some(n => n < 0) ? undefined : control, { key: 'sum', value: control.value }),
                vControl({ key: 1, value: numbers[0] }),
                vControl({ key: 2, value: numbers[1] }),
            ])).build([-10, -20]);

            const array = form.control as FormArray;

            expect(form.value).toEqual([-10, -20]);
            expect(array.length).toBe(2);
            
            form.setValue([10, 20]);
            
            expect(form.value).toEqual([999, 10, 20]);
            expect(array.length).toBe(3);
        });

        it('should remove native control if it is switched to unbind', () => {
            const control = new FormControl(999);
            const form = vForm((numbers: number[]) => vArray([
                vNative(numbers.some(n => n < 0) ? undefined : control, { key: 'sum', value: control.value }),
                vControl({ key: 1, value: numbers[0] }),
                vControl({ key: 2, value: numbers[1] }),
            ])).build([10, 20]);

            const array = form.control as FormArray;

            expect(form.value).toEqual([999, 10, 20]);
            expect(array.length).toBe(3);
            
            form.setValue([-10, -20]);
            
            expect(form.value).toEqual([-10, -20]);
            expect(array.length).toBe(2);
        });

        it('should not update "updateOn" flag', () => {
            const form = renderConditionalArray(
                fibonaci10,
                50,
                [{ updateOn: VFormHooks.Change }],
                [{ updateOn: VFormHooks.Blur }]);
    
            form.setValue(fibonaci2_10);
            
            expect(form.control.updateOn).toBe(VFormHooks.Change);
        });
    });

    describe('getLastFormNode', () => {
        it('should return node from the latest render operation', () => {
            const node1 = vArray(withItem(fibonaci10));
            const node2 = vArray({
                validator: moreThan10,
            }, withItem(fibonaci10));
            const node3 = vArray({
                validator: even,
            }, withItem(fibonaci10));
            const fn = jasmine.createSpy().and.returnValues(node1, node2, node3);

            const form = vForm(fn).build(fibonaci10);

            expect(getLastFormNode(form.control)).toBe(node1);

            form.update();
            expect(getLastFormNode(form.control)).toBe(node2);

            form.update();
            expect(getLastFormNode(form.control)).toBe(node3);
        });
    });

    describe('side effects', () => {
        it('should restore enabled state', () => {
            const form = renderArray(fibonaci10);

            form.control.disable();

            expect(form.control.disabled).toBeTrue();
            
            form.update();

            expect(form.control.disabled).toBeFalse();
        });

        it('should restore disabled state', () => {
            const form = renderArray(fibonaci10, { disabled: true });

            form.control.enable();

            expect(form.control.disabled).toBeFalse();
            
            form.update();

            expect(form.control.disabled).toBeTrue();
        });

        it('should do nothing if touched state is not specified', () => {
            const form = renderArray(fibonaci10);

            form.control.markAsTouched()

            expect(form.control.touched).toBeTrue();
            
            form.update();

            expect(form.control.touched).toBeTrue();

            form.control.markAsUntouched();

            expect(form.control.touched).toBeFalse();

            form.update();

            expect(form.control.touched).toBeFalse();
        });

        it('should restore untouched state', () => {
            const form = renderArray(fibonaci10, { touched: false });

            form.control.markAsTouched()

            expect(form.control.touched).toBeTrue();
            
            form.update();

            expect(form.control.touched).toBeFalse();
        });

        it('should restore touched state', () => {
            const form = renderArray(fibonaci10, { touched: true });

            form.control.markAsUntouched();

            expect(form.control.touched).toBeFalse();
            
            form.update();

            expect(form.control.touched).toBeTrue();
        });

        it('should do nothing if dirty state is not specified', () => {
            const form = renderArray(fibonaci10);

            form.control.markAsDirty()

            expect(form.control.dirty).toBeTrue();
            
            form.update();

            expect(form.control.dirty).toBeTrue();

            form.control.markAsPristine();

            expect(form.control.dirty).toBeFalse();
            
            form.update();

            expect(form.control.dirty).toBeFalse();
        });

        it('should restore pristine state', () => {
            const form = renderArray(fibonaci10, { dirty: false });

            form.control.markAsDirty()

            expect(form.control.dirty).toBeTrue();
            
            form.update();

            expect(form.control.dirty).toBeFalse();
        });

        it('should restore dirty state', () => {
            const form = renderArray(fibonaci10, { dirty: true });

            form.control.markAsPristine();

            expect(form.control.dirty).toBeFalse();
            
            form.update();

            expect(form.control.dirty).toBeTrue();
        });

        it('should remove not specified controls', () => {
            const form = renderArray(fibonaci5, {}, withItem(fibonaci5));

            const array = form.control as FormArray;
            const taxControl = createTaxControl();

            array.insert(0, taxControl);

            expect(array.length).toBe(6);
            expect(array.get('0')).toBe(taxControl);

            form.update();

            expect(array.length).toBe(5);
            expect(array.get('0')).not.toBe(taxControl);
        });

        it('should leave control if it was specified', () => {
            const form = renderConditionalArray(
                fibonaci10,
                50,
                [
                    {},
                    withItem(fibonaci10),
                ],
                [
                    {},
                    [
                        vTaxModel,
                        ...withItem(fibonaci2_10),
                    ],
                ]);

                const array = form.control as FormArray;
                const taxControl = createTaxControl();

                array.insert(0, taxControl);
    
                expect(array.length).toBe(11);
                expect(array.get('0')).toBe(taxControl);
                
                form.setValue(fibonaci2_10);
                
                expect(array.length).toBe(11);
                expect(array.get('0')).toBe(taxControl);
                expect(taxControl.value).toEqual(taxData);
            
        });
    });
});
