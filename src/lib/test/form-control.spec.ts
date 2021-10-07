import { getFormNode, vControl, VForm, vForm, VFormControlOptions, vValidator } from '..';
import { trackControl } from './test-utils';

const moreThan10 = vValidator(control => control.value <= 10 ? { min: true } : null);
const even = vValidator(control => (control.value % 2) === 1 ? { even: true } : null);

function renderNumber(n: number, options?: VFormControlOptions): VForm<number> {
    return vForm(() => vControl(options)).build(n);
}

function renderConditionalNumber(initial: number, anchor: number, optionsLess: VFormControlOptions, optionsMore: VFormControlOptions): VForm<number> {
    return vForm((value: number) => vControl(value < anchor ? optionsLess : optionsMore)).build(initial);
}

function renderDisabledConditionalNumber(initial: number, anchor: number): VForm<number> {
    return renderConditionalNumber(initial, anchor, { disabled: true }, { disabled: false });
}

// Should it bind values in vForm?
// Should we allow to use simple validator functions?

describe('VFormControl', () => {
    describe('first render', () => {
        it('should render control', () => {
            expect(renderNumber(1).control).toBeTruthy();
        });
    
        it('should render enabled control, by default', () => {
            expect(renderNumber(1).control.disabled).toBeFalse();
        });
    
        it('should render disabled control if "disabled" flag is set to "true"', () => {
            expect(renderNumber(1, { disabled: true }).control.disabled).toBeTrue();
        });
    
        it('should render enabled control if "disabled" flag is set to "false"', () => {
            expect(renderNumber(1, { disabled: false }).control.disabled).toBeFalse();
        });

        it('should not assign any validators by default', () => {
            expect(renderNumber(1).control.validator).toBeFalsy();
        });

        it('should assign required validator if "required" is true', () => {
            expect(renderNumber(null as any, { required: true }).control.errors).toEqual({ required: true });
        });

        it('should assign provided validator', () => {
            const options = { validator: moreThan10 };
            expect(renderNumber(1, options).control.errors).toEqual({ min: true });
            expect(renderNumber(100, options).control.errors).toBeFalsy();
        });

        it('should return merged validation result', () => {
            const options = { validator: [moreThan10, even] };
            expect(renderNumber(1, options).control.errors).toEqual({ min: true, even: true });
            expect(renderNumber(4, options).control.errors).toEqual({ min: true });
            expect(renderNumber(13, options).control.errors).toEqual({ even: true });
            expect(renderNumber(100, options).control.errors).toBeFalsy();
        });

        it('should prefer required validator over all other validators', () => {
            const options = {
                required: true,
                validator: moreThan10,
            };

            expect(renderNumber(null as any, options).control.errors).toEqual({ required: true });
            expect(renderNumber(1, options).control.errors).toEqual({ min: true });
            expect(renderNumber(100, options).control.errors).toBeFalsy();
        });
    });

    describe('getters', () => {
        it('should render provided value', () => {
            expect(renderNumber(1).value).toBe(1);
        });
    
        it('should return value if "disabled"', () => {
            expect(renderNumber(1, { disabled: true }).value).toBe(1);
        });
    
        it('should return rawValue', () => {
            expect(renderNumber(1).rawValue).toBe(1);
        });
    
        it('should return rawValue if "disabled"', () => {
            expect(renderNumber(1, { disabled: true }).rawValue).toBe(1);
        });
    });

    describe('virtual function', () => {
        it('should accept initial value', () => {
            const fn = jasmine.createSpy('virtual-fn').and.returnValue(vControl());
            const form = vForm(fn).build(1 as number);
    
            expect(fn.calls.count()).toBe(1);
            expect(fn.calls.mostRecent().args[0]).toBe(1);
        });
    
        it('should accept value passed into "setValue" method', () => {
            const fn = jasmine.createSpy('virtual-fn').and.returnValue(vControl());
            const form = vForm(fn).build(1 as number);
    
            form.setValue(5);
    
            expect(fn.calls.count()).toBe(2);
            expect(fn.calls.mostRecent().args[0]).toBe(5);
        });
    
        it('should accept current value if "update" is called', () => {
            const fn = jasmine.createSpy('virtual-fn').and.returnValue(vControl());
            const form = vForm(fn).build(1 as number);
    
            form.update();
    
            expect(fn.calls.count()).toBe(2);
            expect(fn.calls.mostRecent().args[0]).toBe(1);
        });
    
        it('should not be called if value was changed using "control.setValue"', () => {
            const fn = jasmine.createSpy('virtual-fn').and.returnValue(vControl());
            const form = vForm(fn).build(1 as number);
    
            form.control.setValue(5);
    
            expect(fn.calls.count()).toBe(1);
            expect(fn.calls.mostRecent().args[0]).toBe(1);
        });
    });

    describe('setValue', () => {
        it('should update control if it is called with different value', () => {
            const form = renderNumber(1);
    
            const tracker = trackControl(form.control);

            form.setValue(5);
    
            expect(form.value).toBe(5);
            expect(tracker.changed).toBeTrue();
        });
    
        it('should not update control if value was not changed', () => {
            const form = renderNumber(1);
    
            const tracker = trackControl(form.control);
    
            form.setValue(1);
    
            expect(tracker.changed).toBeFalse();
        });
    });

    describe('update', () => {
        it('should do nothing if it is called without changing a value', () => {
            const form = renderNumber(1);
    
            const tracker = trackControl(form.control);
    
            form.update();
    
            expect(tracker.changed).toBeFalse();
        });

        it('should do nothing if only value was changed', () => {
            const form = renderNumber(1);

            form.control.setValue(5);
    
            const tracker = trackControl(form.control);

            form.update();
    
            expect(tracker.changed).toBeFalse();
        });
    });

    describe('reconcilation', () => {
        it('should switch state of control from enabled to disabled', () => {
            const form = renderDisabledConditionalNumber(7, 5);
    
            expect(form.control.disabled).toBeFalse();
    
            form.setValue(2);
    
            expect(form.control.disabled).toBeTrue();
        });

        it('should switch state of control from disabled to enabled', () => {
            const form = renderDisabledConditionalNumber(2, 5);
    
            expect(form.control.disabled).toBeTrue();
    
            form.setValue(7);
    
            expect(form.control.disabled).toBeFalse();
        });

        it('should do nothing if disabled flag was not modified in vform tree', () => {
            const form = vForm(() => vControl({ disabled: true })).build(2);
    
            const tracker = trackControl(form.control);
    
            form.update();
    
            expect(tracker.changed).toBeFalse();
        });

        it('should assign validators', () => {
            const form = renderConditionalNumber(2, 5, {}, { validator: moreThan10 });
    
            expect(form.control.errors).toBeFalsy();
    
            form.setValue(7);
    
            expect(form.control.errors).toEqual({ min: true });
        });

        it('should remove validators', () => {
            const form = renderConditionalNumber(7, 5, {}, { validator: moreThan10 });
    
            expect(form.control.errors).toEqual({ min: true });
    
            form.setValue(2);
    
            expect(form.control.errors).toBeFalsy();
        });

        it('should change validators', () => {
            const form = renderConditionalNumber(1, 5, { validator: moreThan10 }, { validator: [moreThan10, even] });
    
            expect(form.control.errors).toEqual({ min: true });
    
            form.setValue(7);
    
            expect(form.control.errors).toEqual({ min: true, even: true });
        });

        it('should do nothing if validators were not changed', () => {
            const form = vForm(() => vControl({ required: true, validator: [moreThan10, even] })).build(1);
    
            const tracker = trackControl(form.control);
    
            form.update();
    
            expect(tracker.changed).toBeFalse();
        });

        it('should not recreate underlying FormControl', () => {
            const form = renderConditionalNumber(1, 5, { validator: moreThan10 }, { validator: [moreThan10, even] });
    
            const control = form.control;
    
            form.setValue(7);
    
            expect(form.control).toBe(control);
        });
    });

    describe('getFormNode', () => {
        it('should return node from the latest render operation', () => {
            const node1 = vControl();
            const node2 = vControl();
            const node3 = vControl();
            const fn = jasmine.createSpy().and.returnValues(node1, node2, node3);

            const form = vForm(fn).build(1);

            expect(getFormNode(form.control)).toBe(node1);

            form.update();
            expect(getFormNode(form.control)).toBe(node2);

            form.update();
            expect(getFormNode(form.control)).toBe(node3);
        });
    });
});
