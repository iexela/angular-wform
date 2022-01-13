import { fakeAsync, tick } from '@angular/core/testing';
import { FormArray, FormControl } from '@angular/forms';
import { wArray, wControl, WFormArrayOptions, WFormControlOptions, wGroup, wNative, wPortal, wSkip } from '../basic';
import { wForm, WFormBuilder } from '../builder';
import { WForm } from '../form';
import { WFormArrayChildren, WFormHooks } from '../model';
import { getLastFormNode } from '../reconcilation';
import { wValidator, wValidatorAsync } from '../validators';
import { Box, createTaxControl, elephant, even, krokodile, moreThan10, mouse, taxData, vTaxModel } from './test-mocks';
import { andTick, trackControl } from './test-utils';

function defaultItemRenderer<T>(value: T, index: number): WFormControlOptions<T> {
    return { key: index, value };
}

function withItem<T>(items: T[], fn: (value: T, index: number) => WFormControlOptions<T> = defaultItemRenderer): WFormArrayChildren {
    return (items || []).map((item, index) => wControl(fn(item, index)));
}

const fibonaci5 = [0, 1, 1, 2, 3];
const fibonaci10 = [0, 1, 1, 2, 3, 5, 8, 13, 21, 34];

const fibonaci2_5 = [1, 2, 3, 5, 8];
const fibonaci2_10 = [1, 2, 3, 5, 8, 13, 21, 34, 55, 89];

const lengthLessThan10 = wValidator(control => control.value.length >= 10 ? { length: true } : null);
const startedFrom0 = wValidator(control => control.value[0] !== 0 ? { zero: true } : null);

const lengthLessThan10Async = wValidatorAsync(control => Promise.resolve(control.value.length >= 10 ? { length: true } : null));
const startedFrom0Async = wValidatorAsync(control => Promise.resolve(control.value[0] !== 0 ? { zero: true } : null));

function renderArray(initial: number[], options: WFormArrayOptions = {}, children?: WFormArrayChildren): WForm<number[]> {
    return wForm((current: number[]) => wArray(options, children || withItem(current)))
        .updateOnChange(false)
        .lenient()
        .build(initial);
}

function renderConditionalArray(initial: number[],
                                anchor: number,
                                [optionsLess, childrenLess]: [WFormArrayOptions, WFormArrayChildren?],
                                [optionsMore, childrenMore]: [WFormArrayOptions, WFormArrayChildren?]): WForm<number[]> {
    return wForm((value: number[]) => {
        const isLess = value.every(v => v < anchor);
        return wArray(isLess ? optionsLess : optionsMore, (isLess ? childrenLess : childrenMore) || withItem(value));
    }).updateOnChange(false).lenient().build(initial);
}

function renderDisabledConditionalGroup(initial: number[], anchor: number): WForm<number[]> {
    return renderConditionalArray(initial, anchor, [{ disabled: true }], [{ disabled: false }]);
}

function boxArrayFormBuilder(): WFormBuilder<Box[]> {
    return wForm((boxes: Box[]) => wArray(boxes.map(box => wGroup({ key: box.name }, {
        name: wControl(),
        weight: wControl(),
        volume: wControl(),
    })))).updateOnChange(false);
}

function boxArrayFormBuilderWithoutKeys(): WFormBuilder<Box[]> {
    return wForm((boxes: Box[]) => wArray(boxes.map(box => wGroup({
        name: wControl(),
        weight: wControl(),
        volume: wControl(),
    })))).updateOnChange(false);
}

describe('WFormArray', () => {
    describe('first render', () => {
        it('should render control', () => {
            expect(renderArray(fibonaci5).control).toBeTruthy();
        });
    
        it('should render enabled control, by default', () => {
            expect(renderArray(fibonaci5).control.disabled).toBe(false);;
        });
    
        it('should render disabled control if "disabled" flag is set to "true"', () => {
            expect(renderArray(fibonaci5, { disabled: true }).control.disabled).toBe(true);;
        });
    
        it('should render enabled control if "disabled" flag is set to "false"', () => {
            expect(renderArray(fibonaci5, { disabled: false }).control.disabled).toBe(false);;
        });

        it('should enable all internal controls, by default', () => {
            const form = renderArray(fibonaci5, {}, withItem(fibonaci5));

            expect(form.get('0').disabled).toBe(false);;
            expect(form.get('1').disabled).toBe(false);;
        });

        it('should disable all internal controls if "disabled" is true', () => {
            const form = renderArray(fibonaci5, {
                disabled: true,
            }, withItem(fibonaci5));

            expect(form.get('0').disabled).toBe(true);;
            expect(form.get('1').disabled).toBe(true);;
        });

        it('should disable all internal controls if "disabled" is true (regardless internal controls disabled flag)', () => {
            const form = renderArray(fibonaci5, {
                disabled: true,
            }, withItem(fibonaci5, () => ({ disabled: false })));

            expect(form.get('0').disabled).toBe(true);;
            expect(form.get('1').disabled).toBe(true);;
        });

        it('should leave "disabled" state for internal controls as they desire when "disabled" is false', () => {
            const form = renderArray(fibonaci5, {
                disabled: false,
            }, withItem(fibonaci5, (_, i) => ({ disabled: (i % 2) === 0 })));

            expect(form.get('0').disabled).toBe(true);;
            expect(form.get('1').disabled).toBe(false);;
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

            expect(form.control.dirty).toBe(false);;
        });

        it('should not mark control as dirty if corresponding tiny flag is set to false', () => {
            const form = renderArray(fibonaci5, { dirty: false });

            expect(form.control.dirty).toBe(false);;
        });

        it('should mark control as dirty if corresponding tiny flag is set to true', () => {
            const form = renderArray(fibonaci5, { dirty: true });

            expect(form.control.dirty).toBe(true);;
        });

        it('should not mark control as touched if corresponding tiny flag is not set', () => {
            const form = renderArray(fibonaci5, {});

            expect(form.control.touched).toBe(false);;
        });

        it('should not mark control as touched if corresponding tiny flag is set to false', () => {
            const form = renderArray(fibonaci5, { touched: false });

            expect(form.control.touched).toBe(false);;
        });

        it('should mark control as touched if corresponding tiny flag is set to true', () => {
            const form = renderArray(fibonaci5, { touched: true });

            expect(form.control.touched).toBe(true);;
        });

        it('should not render skipped control', () => {
            const form = wForm((numbers: number[]) => wArray([
                wSkip(),
                wControl({ key: 1, value: numbers[0] }),
                wControl({ key: 2, value: numbers[1] }),
            ])).updateOnChange(false).build([10, 20]);

            const array = form.control as FormArray;
            expect(form.value).toEqual([10, 20]);
            expect(array.length).toBe(2);
        });

        it('should not render native control, if it is not bound', () => {
            const form = wForm((numbers: number[]) => wArray([
                wNative(),
                wControl({ key: 1, value: numbers[0] }),
                wControl({ key: 2, value: numbers[1] }),
            ])).updateOnChange(false).build([10, 20]);

            const array = form.control as FormArray;
            expect(form.value).toEqual([10, 20]);
            expect(array.length).toBe(2);
        });

        it('should render native control, if it is bound', () => {
            const control = new FormControl(999);
            const form = wForm((numbers: number[]) => wArray([
                wNative(control, { key: 999, value: control.value }),
                wControl({ key: 1, value: numbers[0] }),
                wControl({ key: 2, value: numbers[1] }),
            ])).updateOnChange(false).build([10, 20]);

            const array = form.control as FormArray;
            expect(form.value).toEqual([999, 10, 20]);
            expect(array.length).toBe(3);
        });

        it('should not render portal control, if it is not connected', () => {
            const form = wForm((numbers: number[]) => wArray([
                wPortal('start'),
                wControl({ key: 1, value: numbers[0] }),
                wControl({ key: 2, value: numbers[1] }),
            ])).updateOnChange(false).build([10, 20]);

            const array = form.control as FormArray;
            expect(form.value).toEqual([10, 20]);
            expect(array.length).toBe(2);
        });

        it('should set updateOn flag to "change", by default', () => {
            const form = renderArray(fibonaci5, {});

            expect(form.control.updateOn).toBe(WFormHooks.Change);
            expect(form.get('1').updateOn).toBe(WFormHooks.Change);
        });

        it('should allow to set updateOn flag', () => {
            const form = renderArray(fibonaci5, { updateOn: WFormHooks.Blur });

            expect(form.control.updateOn).toBe(WFormHooks.Blur);
            expect(form.get('1').updateOn).toBe(WFormHooks.Blur);
        });

        it('should allow to redeclare updateOn flag on child level', () => {
            const form = renderArray(
                fibonaci5,
                { updateOn: WFormHooks.Blur },
                withItem(fibonaci5, (_, i) => (i === 1 ? { updateOn: WFormHooks.Submit } : {})));

            expect(form.control.updateOn).toBe(WFormHooks.Blur);
            expect(form.get('0').updateOn).toBe(WFormHooks.Blur);
            expect(form.get('1').updateOn).toBe(WFormHooks.Submit);
        });
    });

    describe('value getters', () => {
        it('should render provided value', () => {
            expect(renderArray(fibonaci5).value).toEqual(fibonaci5);
        });
    
        it('should return only fields mapped to controls', () => {
            const form = wForm(() => wArray(withItem(fibonaci5)))
                .updateOnChange(false)
                .build(fibonaci10);

            expect(form.value).toEqual(fibonaci5);
        });
    
        it('should return all fields mapped to controls', () => {
            const form = wForm(() => wArray(withItem(fibonaci10)))
                .updateOnChange(false)
                .build(fibonaci5);

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
            expect(tracker.changed).toBe(true);;
        });
    
        it('should not update control if value was not changed', () => {
            const form = renderArray(fibonaci5);
    
            const tracker = trackControl(form.control);
    
            form.setValue([ ...fibonaci5 ]);
    
            expect(tracker.changed).toBe(false);;
        });
    
        it('should not update control if unrelated field was added', () => {
            const form = renderArray(fibonaci5, {}, withItem(fibonaci5));
    
            const tracker = trackControl(form.control);
    
            form.setValue(fibonaci10);
    
            expect(tracker.changed).toBe(false);;
        });
    });

    describe('update', () => {
        it('should do nothing if it is called without changing a value', () => {
            const form = renderArray(fibonaci5);
    
            const tracker = trackControl(form.control);
    
            form.update();
    
            expect(tracker.changed).toBe(false);;
        });

        it('should do nothing if only value was changed', () => {
            const form = renderArray(fibonaci5);

            form.control.setValue(fibonaci2_5);
    
            const tracker = trackControl(form.control);

            form.update();
    
            expect(tracker.changed).toBe(false);;
        });

        it('should do nothing if value of child control was changed', () => {
            const form = renderArray(fibonaci5);

            form.control.get('2')!.setValue(fibonaci5[2] + 500);
    
            const tracker = trackControl(form.control);

            form.update();
    
            expect(tracker.changed).toBe(false);;
        });
    });

    describe('reconcilation', () => {
        it('should switch state of control from enabled to disabled', () => {
            const form = renderDisabledConditionalGroup(fibonaci10, 20);
    
            expect(form.control.disabled).toBe(false);;
    
            form.setValue(fibonaci5);
    
            expect(form.control.disabled).toBe(true);;
            expect(form.get('0').disabled).toBe(true);;
            expect(form.get('1').disabled).toBe(true);;
        });

        it('should switch state of control from disabled to enabled', () => {
            const form = renderDisabledConditionalGroup(fibonaci5, 20);
    
            expect(form.control.disabled).toBe(true);;
    
            form.setValue(fibonaci10);
    
            expect(form.control.disabled).toBe(false);;
            expect(form.get('0').disabled).toBe(false);;
            expect(form.get('1').disabled).toBe(false);;
        });

        it('should do nothing if disabled flag was not modified in wform tree', () => {
            const form = wForm(() => wArray({ disabled: true }, withItem(fibonaci5)))
                .updateOnChange(false)
                .build(fibonaci5);
    
            const tracker = trackControl(form.control);
    
            form.update();
    
            expect(tracker.changed).toBe(false);;
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
    
            expect(form.control.disabled).toBe(false);;
    
            form.setValue(fibonaci10);
    
            expect(form.control.disabled).toBe(true);;
            expect(form.get('0').disabled).toBe(true);;
            expect(form.get('1').disabled).toBe(true);;
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
    
            expect(form.control.disabled).toBe(true);;
    
            form.setValue(fibonaci2_10);
    
            expect(form.control.disabled).toBe(false);;
            expect(form.get('0').disabled).toBe(false);;
            expect(form.get('1').disabled).toBe(true);;
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
    
            expect(form.get('0').disabled).toBe(true);;
            expect(form.get('1').disabled).toBe(false);;
    
            form.setValue(fibonaci2_10);
    
            expect(form.get('0').disabled).toBe(false);;
            expect(form.get('1').disabled).toBe(true);;
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
                const form = wForm(() => wArray({
                    validator: [lengthLessThan10, startedFrom0],
                }, withItem(fibonaci5))).updateOnChange(false).build(fibonaci5);
        
                const tracker = trackControl(form.control);
        
                form.update();
        
                expect(tracker.changed).toBe(false);;
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
                const form = wForm(() => wArray({
                    asyncValidator: [lengthLessThan10Async, startedFrom0Async],
                }, withItem(fibonaci5))).updateOnChange(false).build(fibonaci5);
        
                tick();
        
                const tracker = trackControl(form.control);
        
                form.update();

                tick();
        
                expect(tracker.changed).toBe(false);;
            }));
        });

        it('should not update dirty flag if corresponding tiny flag is not set', () => {
            const form = renderConditionalArray(fibonaci10, 50, [{}], [{}]);

            form.setValue(fibonaci2_10);

            expect(form.control.dirty).toBe(false);;

            form.control.markAsDirty();

            form.setValue(fibonaci2_10.concat([999]));

            expect(form.control.dirty).toBe(true);;
        });

        it('should unset dirty flag if corresponding tiny flag is set to false', () => {
            const form = renderConditionalArray(fibonaci10, 50, [{}], [{ dirty: false }]);

            form.setValue(fibonaci2_10);

            expect(form.control.dirty).toBe(false);;

            form.control.markAsDirty();

            form.setValue(fibonaci2_10.concat(999));

            expect(form.control.dirty).toBe(false);;
        });

        it('should mark control as dirty if corresponding tiny flag is set to true', () => {
            const form = renderConditionalArray(fibonaci10, 50, [{}], [{ dirty: true }]);

            form.setValue(fibonaci2_10);

            expect(form.control.dirty).toBe(true);;

            form.control.markAsPristine();

            form.setValue(fibonaci2_10.concat(999));

            expect(form.control.dirty).toBe(true);;
        });

        it('should not update touched flag if corresponding tiny flag is not set', () => {
            const form = renderConditionalArray(fibonaci10, 50, [{}], [{}]);

            form.setValue(fibonaci2_10);

            expect(form.control.touched).toBe(false);;

            form.control.markAsTouched();

            form.setValue(fibonaci2_10);

            expect(form.control.touched).toBe(true);;
        });

        it('should unset touched flag if corresponding tiny flag is set to false', () => {
            const form = renderConditionalArray(fibonaci10, 50, [{}], [{ touched: false }]);

            form.setValue(fibonaci2_10);

            expect(form.control.touched).toBe(false);;

            form.control.markAsTouched();

            form.setValue(fibonaci2_10.concat(999));

            expect(form.control.touched).toBe(false);;
        });

        it('should mark control as dirty if corresponding tiny flag is set to true', () => {
            const form = renderConditionalArray(fibonaci10, 50, [{}], [{ touched: true }]);

            form.setValue(fibonaci2_10);

            expect(form.control.touched).toBe(true);;

            form.control.markAsUntouched();

            form.setValue(fibonaci2_10.concat(999));

            expect(form.control.touched).toBe(true);;
        });
    
        it('should not recreate underlying FormControl', () => {
            const form = renderConditionalArray(fibonaci10, 50, [{ validator: startedFrom0 }], [{ validator: [lengthLessThan10, startedFrom0] }]);
    
            const control = form.control;
    
            form.setValue(fibonaci2_10);
    
            expect(form.control).toBe(control);
        });

        it('should append new control if it appears in the end of the wform description', () => {
            const form = boxArrayFormBuilder().build([krokodile, elephant]);

            const krokodileControl = form.get('0');
            const elephantControl = form.get('1');

            const newBoxes = [krokodile, elephant, mouse];

            form.setValue(newBoxes);

            expect(form.value).toEqual(newBoxes);
            expect(form.get('0')).toBe(krokodileControl);
            expect(form.get('1')).toBe(elephantControl);
            expect(form.get('2')).toBeTruthy();
        });

        it('should prepend new control if it appears in the beginning of the wform description', () => {
            const form = boxArrayFormBuilder().build([krokodile, elephant]);

            const krokodileControl = form.get('0');
            const elephantControl = form.get('1');

            const newBoxes = [mouse, krokodile, elephant];

            form.setValue(newBoxes);

            expect(form.value).toEqual(newBoxes);
            expect(form.get('0')).toBeTruthy();
            expect(form.get('1')).toBe(krokodileControl);
            expect(form.get('2')).toBe(elephantControl);
        });

        it('should insert new control if it appears in the middle of the wform description', () => {
            const form = boxArrayFormBuilder().build([krokodile, elephant]);

            const krokodileControl = form.get('0');
            const elephantControl = form.get('1');

            const newBoxes = [krokodile, mouse, elephant];

            form.setValue(newBoxes);

            expect(form.value).toEqual(newBoxes);
            expect(form.get('0')).toBe(krokodileControl);
            expect(form.get('1')).toBeTruthy();
            expect(form.get('2')).toBe(elephantControl);
        });

        it('should move controls if they positions were chnaged in the wform description', () => {
            const form = boxArrayFormBuilder().build([krokodile, elephant]);

            const krokodileControl = form.get('0');
            const elephantControl = form.get('1');

            const newBoxes = [elephant, mouse, krokodile];

            form.setValue(newBoxes);

            expect(form.value).toEqual(newBoxes);
            expect(form.get('0')).toBe(elephantControl);
            expect(form.get('1')).toBeTruthy();
            expect(form.get('2')).toBe(krokodileControl);
        });

        it('should remove control if it disappears from the wform description', () => {
            const form = boxArrayFormBuilder().build([krokodile, elephant]);

            const krokodileControl = form.get('0');
            const elephantControl = form.get('1');

            const newBoxes = [elephant, mouse];

            form.setValue(newBoxes);

            expect(form.value).toEqual(newBoxes);
            expect(form.get('0')).toBe(elephantControl);
            expect(form.get('1')).toBeTruthy();
            expect(form.get('1')).not.toBe(krokodileControl);
        });

        it('should update array controls by key if it is specified', () => {
            const form = boxArrayFormBuilder().build([krokodile, elephant]);

            const krokodileControl = form.get('0');
            const elephantControl = form.get('1');

            form.setValue([elephant, krokodile]);

            expect(krokodileControl.value).toEqual(krokodile);
            expect(elephantControl.value).toEqual(elephant);
        });

        it('should update array controls in order if key is not specified', () => {
            const form = boxArrayFormBuilderWithoutKeys().build([krokodile, elephant]);

            const krokodileControl = form.get('0');
            const elephantControl = form.get('1');

            form.setValue([elephant, krokodile]);

            expect(krokodileControl.value).toEqual(elephant);
            expect(elephantControl.value).toEqual(krokodile);
        });

        it('should add control if it is switched from vSkip', () => {
            const form = wForm((numbers: number[]) => wArray([
                numbers.some(n => n < 0) ? wSkip() : wControl({ key: 'sum', value: numbers[0] + numbers[1] }),
                wControl({ key: 1, value: numbers[0] }),
                wControl({ key: 2, value: numbers[1] }),
            ])).updateOnChange(false).build([-10, -20]);

            const array = form.control as FormArray;

            expect(form.value).toEqual([-10, -20]);
            expect(array.length).toBe(2);
            
            form.setValue([10, 20]);
            
            expect(form.value).toEqual([30, 10, 20]);
            expect(array.length).toBe(3);
        });

        it('should remove control if it is switched to vSkip', () => {
            const form = wForm((numbers: number[]) => wArray([
                numbers.some(n => n < 0) ? wSkip() : wControl({ key: 'sum', value: numbers[0] + numbers[1] }),
                wControl({ key: 1, value: numbers[0] }),
                wControl({ key: 2, value: numbers[1] }),
            ])).updateOnChange(false).build([10, 20]);

            const array = form.control as FormArray;
            
            expect(form.value).toEqual([30, 10, 20]);
            expect(array.length).toBe(3);
            
            form.setValue([-10, -20]);

            expect(form.value).toEqual([-10, -20]);
            expect(array.length).toBe(2);
        });

        it('should add native control, if it is switched to bind', () => {
            const control = new FormControl(999);
            const form = wForm((numbers: number[]) => wArray([
                wNative(numbers.some(n => n < 0) ? undefined : control, { key: 'sum', value: control.value }),
                wControl({ key: 1, value: numbers[0] }),
                wControl({ key: 2, value: numbers[1] }),
            ])).updateOnChange(false).build([-10, -20]);

            const array = form.control as FormArray;

            expect(form.value).toEqual([-10, -20]);
            expect(array.length).toBe(2);
            
            form.setValue([10, 20]);
            
            expect(form.value).toEqual([999, 10, 20]);
            expect(array.length).toBe(3);
        });

        it('should remove native control if it is switched to unbind', () => {
            const control = new FormControl(999);
            const form = wForm((numbers: number[]) => wArray([
                wNative(numbers.some(n => n < 0) ? undefined : control, { key: 'sum', value: control.value }),
                wControl({ key: 1, value: numbers[0] }),
                wControl({ key: 2, value: numbers[1] }),
            ])).updateOnChange(false).build([10, 20]);

            const array = form.control as FormArray;

            expect(form.value).toEqual([999, 10, 20]);
            expect(array.length).toBe(3);
            
            form.setValue([-10, -20]);
            
            expect(form.value).toEqual([-10, -20]);
            expect(array.length).toBe(2);
        });

        it('should add portal control, if it was connected', () => {
            const startForm = wForm((value: number) => wControl({ key: 0 }))
                .updateOnChange(false)
                .build(999);
            const form = wForm((numbers: number[]) => wArray([
                wPortal('start'),
                wControl({ key: 1, value: numbers[0] }),
                wControl({ key: 2, value: numbers[1] }),
            ])).updateOnChange(false).build([10, 20]);

            form.connect('start', startForm);

            const array = form.control as FormArray;
            expect(form.value).toEqual([999, 10, 20]);
            expect(array.length).toBe(3);
            expect(array.at(0)).toBe(startForm.control);
        });

        it('should remove portal control, if it was disconnected', () => {
            const startForm = wForm((value: number) => wControl({ key: 999 }))
                .updateOnChange(false)
                .build(999);
            const form = wForm((numbers: number[]) => wArray([
                wPortal('start'),
                wControl({ key: 1, value: numbers[numbers.length - 2] }),
                wControl({ key: 2, value: numbers[numbers.length - 1] }),
            ])).updateOnChange(false).build([10, 20]);

            form.connect('start', startForm);
            form.disconnect('start');

            const array = form.control as FormArray;
            expect(form.value).toEqual([10, 20]);
            expect(array.length).toBe(2);
        });

        it('should not update "updateOn" flag', () => {
            const form = renderConditionalArray(
                fibonaci10,
                50,
                [{ updateOn: WFormHooks.Change }],
                [{ updateOn: WFormHooks.Blur }]);
    
            form.setValue(fibonaci2_10);
            
            expect(form.control.updateOn).toBe(WFormHooks.Change);
        });
    });

    describe('getLastFormNode', () => {
        it('should return node from the latest render operation', () => {
            const node1 = wArray(withItem(fibonaci10));
            const node2 = wArray({
                validator: moreThan10,
            }, withItem(fibonaci10));
            const node3 = wArray({
                validator: even,
            }, withItem(fibonaci10));
            const fn = jasmine.createSpy().and.returnValues(node1, node2, node3);

            const form = wForm(fn).updateOnChange(false).build(fibonaci10);

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

            expect(form.control.disabled).toBe(true);;
            
            form.update();

            expect(form.control.disabled).toBe(false);;
        });

        it('should restore disabled state', () => {
            const form = renderArray(fibonaci10, { disabled: true });

            form.control.enable();

            expect(form.control.disabled).toBe(false);;
            
            form.update();

            expect(form.control.disabled).toBe(true);;
        });

        it('should do nothing if touched state is not specified', () => {
            const form = renderArray(fibonaci10);

            form.control.markAsTouched()

            expect(form.control.touched).toBe(true);;
            
            form.update();

            expect(form.control.touched).toBe(true);;

            form.control.markAsUntouched();

            expect(form.control.touched).toBe(false);;

            form.update();

            expect(form.control.touched).toBe(false);;
        });

        it('should restore untouched state', () => {
            const form = renderArray(fibonaci10, { touched: false });

            form.control.markAsTouched()

            expect(form.control.touched).toBe(true);;
            
            form.update();

            expect(form.control.touched).toBe(false);;
        });

        it('should restore touched state', () => {
            const form = renderArray(fibonaci10, { touched: true });

            form.control.markAsUntouched();

            expect(form.control.touched).toBe(false);;
            
            form.update();

            expect(form.control.touched).toBe(true);;
        });

        it('should do nothing if dirty state is not specified', () => {
            const form = renderArray(fibonaci10);

            form.control.markAsDirty()

            expect(form.control.dirty).toBe(true);;
            
            form.update();

            expect(form.control.dirty).toBe(true);;

            form.control.markAsPristine();

            expect(form.control.dirty).toBe(false);;
            
            form.update();

            expect(form.control.dirty).toBe(false);;
        });

        it('should restore pristine state', () => {
            const form = renderArray(fibonaci10, { dirty: false });

            form.control.markAsDirty()

            expect(form.control.dirty).toBe(true);;
            
            form.update();

            expect(form.control.dirty).toBe(false);;
        });

        it('should restore dirty state', () => {
            const form = renderArray(fibonaci10, { dirty: true });

            form.control.markAsPristine();

            expect(form.control.dirty).toBe(false);;
            
            form.update();

            expect(form.control.dirty).toBe(true);;
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
