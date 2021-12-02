import { fakeAsync, tick } from '@angular/core/testing';
import { AbstractControl, FormControl } from '@angular/forms';
import { getLastFormNode, vForm, VForm } from '..';
import { VFormNativeOptions, vNative } from '../basic';
import { belarusToRussia, createFlightForm, even, evenAsync, moreThan10, moreThan10Async, russiaToBelarus } from './test-mocks';
import { andTick, trackControl } from './test-utils';

function renderControl(control: AbstractControl, options?: VFormNativeOptions<number>): VForm<number> {
    return vForm(() => vNative(control, options)).build(control.value);
}

function renderConditionalControl(control: AbstractControl, anchor: number, optionsLess: VFormNativeOptions<number>, optionsMore: VFormNativeOptions<number>): VForm<number> {
    return vForm((value: number) => vNative(control, value < anchor ? optionsLess : optionsMore)).build(control.value);
}

function testControl(n: number): FormControl {
    return new FormControl(n);
}

describe('VFormNative', () => {
    describe('first render', () => {
        it('should leave the same control', () => {
            const control = testControl(1);
            expect(renderControl(control).control).toBe(control);
        });
    
        it('should render enabled control, by default', () => {
            expect(renderControl(testControl(1)).control.disabled).toBeFalse();
        });
    
        it('should render disabled control if "disabled" flag is set to "true"', () => {
            expect(renderControl(testControl(1), { disabled: true }).control.disabled).toBeTrue();
        });
    
        it('should render enabled control if "disabled" flag is set to "false"', () => {
            expect(renderControl(testControl(1), { disabled: false }).control.disabled).toBeFalse();
        });

        it('should render enabled control, even if control was disabled', () => {
            const control = testControl(1);
            control.disable();
            expect(renderControl(control).control.disabled).toBeFalse();
        });

        it('should render disabled control, even if control was enabled', () => {
            const control = testControl(1);
            control.enable();
            expect(renderControl(control, { disabled: true }).control.disabled).toBeTrue();
        });

        describe('validator', () => {
            it('should not assign any validators by default', () => {
                expect(renderControl(testControl(1)).control.validator).toBeFalsy();
            });
    
            it('should assign provided validator', () => {
                const options = { validator: moreThan10 };
                expect(renderControl(testControl(1), options).control.errors).toEqual({ min: true });
                expect(renderControl(testControl(100), options).control.errors).toBeFalsy();
            });
    
            it('should return merged validation result', () => {
                const options = { validator: [moreThan10, even] };
                expect(renderControl(testControl(1), options).control.errors).toEqual({ min: true, even: true });
                expect(renderControl(testControl(4), options).control.errors).toEqual({ min: true });
                expect(renderControl(testControl(13), options).control.errors).toEqual({ even: true });
                expect(renderControl(testControl(100), options).control.errors).toBeFalsy();
            });
    
            it('should not validate disabled control', () => {
                expect(renderControl(testControl(1), { validator: even, disabled: true }).control.errors).toBeFalsy();
            });
        });

        describe('async validator', () => {
            it('should not assign any async validators by default', () => {
                expect(renderControl(testControl(1)).control.asyncValidator).toBeFalsy();
            });
    
            it('should assign provided async validator', fakeAsync(() => {
                const options = { asyncValidator: moreThan10Async };

                expect(andTick(renderControl(testControl(1), options)).control.errors).toEqual({ min: true });
                expect(andTick(renderControl(testControl(100), options)).control.errors).toBeFalsy();
            }));
    
            it('should return merged async validation result', fakeAsync(() => {
                const options = { asyncValidator: [moreThan10Async, evenAsync] };
                expect(andTick(renderControl(testControl(1), options)).control.errors).toEqual({ min: true, even: true });
                expect(andTick(renderControl(testControl(4), options)).control.errors).toEqual({ min: true });
                expect(andTick(renderControl(testControl(13), options)).control.errors).toEqual({ even: true });
                expect(andTick(renderControl(testControl(100), options)).control.errors).toBeFalsy();
            }));
    
            it('should not run async validator for disabled control', fakeAsync(() => {
                const form = renderControl(testControl(1), { asyncValidator: moreThan10Async, disabled: true });
                tick();
                expect(form.control.errors).toBeFalsy();
            }));
        });

        it('should allow both sync and async validators', fakeAsync(() => {
            const options = { validator: moreThan10, asyncValidator: evenAsync };
            expect(andTick(renderControl(testControl(1), options)).control.errors).toEqual({ min: true });
            expect(andTick(renderControl(testControl(4), options)).control.errors).toEqual({ min: true });
            expect(andTick(renderControl(testControl(13), options)).control.errors).toEqual({ even: true });
            expect(andTick(renderControl(testControl(100), options)).control.errors).toBeFalsy();
        }));

        it('should render value passed into vnode', () => {
            const form = vForm((value: number) => vNative(testControl(1), { value: value + 1 })).build(1 as number);

            expect(form.value).toBe(2);
        });

        it('should leave control dirty flag as is (false) if corresponding tiny flag is not set', () => {
            const form = renderControl(testControl(2), {});

            expect(form.control.dirty).toBeFalse();
        });

        it('should leave control dirty flag as is (true) if corresponding tiny flag is not set', () => {
            const control = testControl(2);
            control.markAsDirty();
            const form = renderControl(control, {});

            expect(form.control.dirty).toBeTrue();
        });

        it('should not mark control as dirty if corresponding tiny flag is set to false', () => {
            const form = renderControl(testControl(2), { dirty: false });

            expect(form.control.dirty).toBeFalse();
        });

        it('should not leave control dirty flag set, if corresponding tiny flag is set to false', () => {
            const control = testControl(2);
            control.markAsDirty();
            const form = renderControl(control, { dirty: false });

            expect(form.control.dirty).toBeFalse();
        });

        it('should mark control as dirty if corresponding tiny flag is set to true', () => {
            const form = renderControl(testControl(2), { dirty: true });

            expect(form.control.dirty).toBeTrue();
        });

        it('should leave control dirty flag set, if corresponding tiny flag is set', () => {
            const control = testControl(2);
            control.markAsDirty();
            const form = renderControl(control, { dirty: true });

            expect(form.control.dirty).toBeTrue();
        });

        it('should leave control touched flag as is (false) if corresponding tiny flag is not set', () => {
            const form = renderControl(testControl(2), {});

            expect(form.control.touched).toBeFalse();
        });

        it('should leave control touched flag as is (true) if corresponding tiny flag is not set', () => {
            const control = testControl(2);
            control.markAsTouched();
            const form = renderControl(control, {});

            expect(form.control.touched).toBeTrue();
        });

        it('should not mark control as touched if corresponding tiny flag is set to false', () => {
            const form = renderControl(testControl(2), { touched: false });

            expect(form.control.touched).toBeFalse();
        });

        it('should not leave control touched flag set, if corresponding tiny flag is set to false', () => {
            const control = testControl(2);
            control.markAsTouched();
            const form = renderControl(control, { touched: false });

            expect(form.control.touched).toBeFalse();
        });

        it('should mark control as touched if corresponding tiny flag is set to true', () => {
            const form = renderControl(testControl(2), { touched: true });

            expect(form.control.touched).toBeTrue();
        });

        it('should leave control touched flag set, if corresponding tiny flag is set', () => {
            const control = testControl(2);
            control.markAsTouched();
            const form = renderControl(control, { touched: true });

            expect(form.control.touched).toBeTrue();
        });
    });

    describe('value getters', () => {
        it('should render value of provided control', () => {
            expect(renderControl(testControl(1)).value).toBe(1);
        });
    
        it('should return value if "disabled"', () => {
            expect(renderControl(testControl(1), { disabled: true }).value).toBe(1);
        });
    
        it('should return rawValue', () => {
            expect(renderControl(testControl(1)).rawValue).toBe(1);
        });
    
        it('should return rawValue if "disabled"', () => {
            expect(renderControl(testControl(1), { disabled: true }).rawValue).toBe(1);
        });
    });

    describe('setValue', () => {
        it('should update control if it is called with different value', () => {
            const form = renderControl(testControl(1));
    
            const tracker = trackControl(form.control);

            form.setValue(5);
    
            expect(form.value).toBe(5);
            expect(tracker.changed).toBeTrue();
        });
    
        it('should not update control if value was not changed', () => {
            const form = renderControl(testControl(1));
    
            const tracker = trackControl(form.control);
    
            form.setValue(1);
    
            expect(tracker.changed).toBeFalse();
        });
    
        it('should not modify control if value is the same', () => {
            const control = createFlightForm(belarusToRussia);
            const form = vForm(() => vNative(control)).build(belarusToRussia);
    
            const tracker = trackControl(form.control);
    
            form.setValue({ ...belarusToRussia, tax: 123 });
    
            expect(tracker.changed).toBeFalse();
        });
    
        it('should modify control if value is different', () => {
            const control = createFlightForm(belarusToRussia);
            const form = vForm(() => vNative(control)).build(belarusToRussia);
    
            const tracker = trackControl(form.control);
    
            form.setValue(russiaToBelarus);
    
            expect(tracker.changed).toBeTrue();
        });
    });

    describe('update', () => {
        it('should do nothing if it is called without changing a value', () => {
            const form = renderControl(testControl(1));
    
            const tracker = trackControl(form.control);
    
            form.update();
    
            expect(tracker.changed).toBeFalse();
        });

        it('should do nothing if only value was changed', () => {
            const form = renderControl(testControl(1));

            form.control.setValue(5);
    
            const tracker = trackControl(form.control);

            form.update();
    
            expect(tracker.changed).toBeFalse();
        });
    });

    describe('reconcilation', () => {
        it('should not update control if it was not changed', () => {
            const control = new FormControl();
            const form = vForm(() => vNative(control)).build(1);

            expect(form.control).toBe(control);
            form.update();
            expect(form.control).toBe(control);
        });

        it('should update control if it was changed', () => {
            const control1 = new FormControl();
            const control2 = new FormControl();
            const factory = jasmine.createSpy().and.returnValues(vNative(control1), vNative(control2));
            const form = vForm(factory).build(1);

            expect(form.control).toBe(control1);
            form.update();
            expect(form.control).toBe(control2);
        });

        it('should switch state of control from enabled to disabled', () => {
            const form = renderConditionalControl(testControl(7), 5, { disabled: true }, { disabled: false });
    
            expect(form.control.disabled).toBeFalse();
    
            form.control.setValue(2);
            form.update();
            
            expect(form.control.disabled).toBeTrue();
        });
        
        it('should switch state of control from disabled to enabled', () => {
            const form = renderConditionalControl(testControl(2), 5, { disabled: true }, { disabled: false });
            
            expect(form.control.disabled).toBeTrue();
            
            form.control.setValue(7);
            form.update();
    
            expect(form.control.disabled).toBeFalse();
        });

        it('should do nothing if disabled flag was not modified in vform tree', () => {
            const control = testControl(1);
            const form = vForm(() => vNative(control, { disabled: true })).build(2);
    
            const tracker = trackControl(form.control);
    
            form.update();
    
            expect(tracker.changed).toBeFalse();
        });

        describe('validator', () => {
            it('should assign validators', () => {
                const form = renderConditionalControl(testControl(2), 5, {}, { validator: moreThan10 });
        
                expect(form.control.errors).toBeFalsy();
        
                form.setValue(7);
        
                expect(form.control.errors).toEqual({ min: true });
            });
    
            it('should remove validators', () => {
                const form = renderConditionalControl(testControl(7), 5, {}, { validator: moreThan10 });
        
                expect(form.control.errors).toEqual({ min: true });
        
                form.setValue(2);
        
                expect(form.control.errors).toBeFalsy();
            });
    
            it('should change validators', () => {
                const form = renderConditionalControl(testControl(1), 5, { validator: moreThan10 }, { validator: [moreThan10, even] });
        
                expect(form.control.errors).toEqual({ min: true });
        
                form.setValue(7);
        
                expect(form.control.errors).toEqual({ min: true, even: true });
            });
    
            it('should rerender control if value was changed in meantime', () => {
                const form = renderConditionalControl(testControl(2), 5, {}, { validator: moreThan10 });
        
                form.control.setValue(7);
        
                expect(form.control.errors).toBeFalsy();
        
                form.update();
    
                expect(form.control.errors).toEqual({ min: true });
            });
    
            it('should do nothing if validators were not changed', () => {
                const control = testControl(1);
                const form = vForm(() => vNative(control, { validator: [moreThan10, even] })).build(1);
        
                const tracker = trackControl(form.control);
        
                form.update();
        
                expect(tracker.changed).toBeFalse();
            });
        });

        describe('async validator', () => {
            it('should assign async validators', fakeAsync(() => {
                const form = renderConditionalControl(testControl(2), 5, {}, { asyncValidator: moreThan10Async });
        
                tick();

                expect(form.control.errors).toBeFalsy();
        
                form.setValue(7);
        
                tick();

                expect(form.control.errors).toEqual({ min: true });
            }));
    
            it('should remove async validators', fakeAsync(() => {
                const form = renderConditionalControl(testControl(7), 5, {}, { asyncValidator: moreThan10Async });
        
                tick();

                expect(form.control.errors).toEqual({ min: true });
        
                form.setValue(2);

                tick();
        
                expect(form.control.errors).toBeFalsy();
            }));
    
            it('should change async validators', fakeAsync(() => {
                const form = renderConditionalControl(testControl(1), 5, { validator: moreThan10 }, { validator: [moreThan10, even] });
        
                tick();

                expect(form.control.errors).toEqual({ min: true });
        
                form.setValue(7);

                tick();
        
                expect(form.control.errors).toEqual({ min: true, even: true });
            }));
    
            it('should rerender control if value was changed in meantime', fakeAsync(() => {
                const form = renderConditionalControl(testControl(2), 5, {}, { validator: moreThan10 });
        
                tick();

                form.control.setValue(7);
        
                expect(form.control.errors).toBeFalsy();
        
                form.update();
    
                tick();

                expect(form.control.errors).toEqual({ min: true });
            }));
    
            it('should do nothing if async validators were not changed', fakeAsync(() => {
                const control = testControl(1);
                const form = vForm((v: number) => vNative(control, { validator: [moreThan10, even] })).build(1);
        
                tick();

                const tracker = trackControl(form.control);
        
                form.update();
        
                tick();

                expect(tracker.changed).toBeFalse();
            }));
        });

        it('should update value by value passed into vnode', () => {
            const control = testControl(1);
            const form = vForm((value: number) => vNative(control, { value: value + 1 })).build(1 as number);

            form.setValue(10);

            expect(form.value).toBe(11);
        });

        it('should not update dirty flag if corresponding tiny flag is not set', () => {
            const form = renderConditionalControl(testControl(2), 5, {}, {});

            form.setValue(7);

            expect(form.control.dirty).toBeFalse();

            form.control.markAsDirty();

            form.control.setValue(9);
            form.update();

            expect(form.control.dirty).toBeTrue();
        });

        it('should unset dirty flag if corresponding tiny flag is set to false', () => {
            const form = renderConditionalControl(testControl(2), 5, {}, { dirty: false });

            form.control.setValue(7);
            form.update();

            expect(form.control.dirty).toBeFalse();

            form.control.markAsDirty();

            form.control.setValue(9);
            form.update();

            expect(form.control.dirty).toBeFalse();
        });

        it('should mark control as dirty if corresponding tiny flag is set to true', () => {
            const form = renderConditionalControl(testControl(2), 5, {}, { dirty: true });

            form.control.setValue(7);
            form.update();

            expect(form.control.dirty).toBeTrue();

            form.control.markAsPristine();

            form.control.setValue(9);
            form.update();

            expect(form.control.dirty).toBeTrue();
        });

        it('should not update touched flag if corresponding tiny flag is not set', () => {
            const form = renderConditionalControl(testControl(2), 5, {}, {});

            form.control.setValue(7);
            form.update();

            expect(form.control.touched).toBeFalse();

            form.control.markAsTouched();

            form.control.setValue(9);
            form.update();

            expect(form.control.touched).toBeTrue();
        });

        it('should unset touched flag if corresponding tiny flag is set to false', () => {
            const form = renderConditionalControl(testControl(2), 5, {}, { touched: false });

            form.control.setValue(7);
            form.update();

            expect(form.control.touched).toBeFalse();

            form.control.markAsTouched();

            form.control.setValue(9);
            form.update();

            expect(form.control.touched).toBeFalse();
        });

        it('should mark control as dirty if corresponding tiny flag is set to true', () => {
            const form = renderConditionalControl(testControl(2), 5, {}, { touched: true });

            form.control.setValue(7);
            form.update();

            expect(form.control.touched).toBeTrue();

            form.control.markAsUntouched();

            form.control.setValue(9);
            form.update();

            expect(form.control.touched).toBeTrue();
        });

        it('should not recreate underlying FormControl', () => {
            const form = renderConditionalControl(testControl(1), 5, { validator: moreThan10 }, { validator: [moreThan10, even] });
    
            const control = form.control;
    
            form.control.setValue(7);
            form.update();
    
            expect(form.control).toBe(control);
        });
    })

    describe('getLastFormNode', () => {
        it('should return node from the latest render operation', () => {
            const control = testControl(1);
            const node1 = vNative(control);
            const node2 = vNative(control, { validator: moreThan10 });
            const node3 = vNative(control, { validator: even });
            const fn = jasmine.createSpy().and.returnValues(node1, node2, node3);

            const form = vForm(fn).build(1);

            expect(getLastFormNode(form.control)).toBe(node1);

            form.update();
            expect(getLastFormNode(form.control)).toBe(node2);

            form.update();
            expect(getLastFormNode(form.control)).toBe(node3);
        });
    });

    describe('side effects', () => {
        it('should restore enabled state', () => {
            const form = renderControl(testControl(1));

            form.control.disable();

            expect(form.control.disabled).toBeTrue();
            
            form.update();

            expect(form.control.disabled).toBeFalse();
        });

        it('should restore disabled state', () => {
            const form = renderControl(testControl(1), { disabled: true });

            form.control.enable();

            expect(form.control.disabled).toBeFalse();
            
            form.update();

            expect(form.control.disabled).toBeTrue();
        });

        it('should do nothing if touched state is not specified', () => {
            const form = renderControl(testControl(1));

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
            const form = renderControl(testControl(1), { touched: false });

            form.control.markAsTouched()

            expect(form.control.touched).toBeTrue();
            
            form.update();

            expect(form.control.touched).toBeFalse();
        });

        it('should restore touched state', () => {
            const form = renderControl(testControl(1), { touched: true });

            form.control.markAsUntouched();

            expect(form.control.touched).toBeFalse();
            
            form.update();

            expect(form.control.touched).toBeTrue();
        });

        it('should do nothing if dirty state is not specified', () => {
            const form = renderControl(testControl(1));

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
            const form = renderControl(testControl(1), { dirty: false });

            form.control.markAsDirty()

            expect(form.control.dirty).toBeTrue();
            
            form.update();

            expect(form.control.dirty).toBeFalse();
        });

        it('should restore dirty state', () => {
            const form = renderControl(testControl(1), { dirty: true });

            form.control.markAsPristine();

            expect(form.control.dirty).toBeFalse();
            
            form.update();

            expect(form.control.dirty).toBeTrue();
        });
    });
});
