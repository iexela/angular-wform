import { getLastFormNode, vArray, vControl, VForm, vForm, VFormArrayChildren, VFormArrayOptions, VFormBuilder, VFormControlOptions, vGroup, vValidator } from '..';
import { Box, elephant, even, krokodile, moreThan10, mouse } from './test-mocks';
import { trackControl } from './test-utils';

function defaultItemRenderer<T>(value: T, index: number): VFormControlOptions {
    return { key: index };
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

function renderArray(initial: number[], options: VFormArrayOptions = {}, children?: VFormArrayChildren): VForm<number[]> {
    return vForm(() => vArray(options, children || withItem(initial))).build(initial);
}

function renderConditionalGroup(initial: number[],
                                anchor: number,
                                [optionsLess, childrenLess]: [VFormArrayOptions, VFormArrayChildren?],
                                [optionsMore, childrenMore]: [VFormArrayOptions, VFormArrayChildren?]): VForm<number[]> {
    return vForm((value: number[]) => {
        const isLess = value.every(v => v < anchor);
        return vArray(isLess ? optionsLess : optionsMore, (isLess ? childrenLess : childrenMore) || withItem(initial));
    }).build(initial);
}

function renderDisabledConditionalGroup(initial: number[], anchor: number): VForm<number[]> {
    return renderConditionalGroup(initial, anchor, [{ disabled: true }], [{ disabled: false }]);
}

function boxArrayFormBuilder(): VFormBuilder<Box[]> {
    return vForm((boxes: Box[]) => vArray(boxes.map(box => vGroup({ key: box.name }, {
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

            expect(form.value).toEqual([...fibonaci5, undefined, undefined, undefined, undefined, undefined] as any[]);
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
            const form = renderArray(fibonaci5);
    
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
            const form = renderConditionalGroup(
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
            const form = renderConditionalGroup(
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
            const form = renderConditionalGroup(
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

        it('should assign validators', () => {
            const form = renderConditionalGroup(fibonaci10, 50, [{}], [{ validator: startedFrom0 }]);

            expect(form.control.errors).toBeFalsy();
    
            form.setValue(fibonaci2_10);

            expect(form.control.errors).toEqual({ zero: true });
        });

        it('should remove validators', () => {
            const form = renderConditionalGroup(fibonaci2_10, 50, [{}], [{ validator: startedFrom0 }]);
    
            expect(form.control.errors).toEqual({ zero: true });
    
            form.setValue(fibonaci10);
    
            expect(form.control.errors).toBeFalsy();
        });

        it('should change validators', () => {
            const form = renderConditionalGroup(fibonaci10, 50, [{ validator: lengthLessThan10 }], [{ validator: [lengthLessThan10, startedFrom0] }]);
    
            expect(form.control.errors).toEqual({ length: true });
    
            form.setValue(fibonaci2_10);
    
            expect(form.control.errors).toEqual({ length: true, zero: true });
        });

        it('should rerender control if value was changed in meantime', () => {
            const form = renderConditionalGroup(fibonaci10, 50, [{}], [{ validator: startedFrom0 }]);
    
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

        it('should not recreate underlying FormControl', () => {
            const form = renderConditionalGroup(fibonaci10, 50, [{ validator: startedFrom0 }], [{ validator: [lengthLessThan10, startedFrom0] }]);
    
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
});
