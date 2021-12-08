import { fakeAsync, tick } from '@angular/core/testing';
import { wControl, WFormControlOptions } from '../basic';
import { wForm } from '../builder';
import { WForm } from '../form';
import { WFormHooks } from '../model';
import { getLastFormNode } from '../reconcilation';
import { even, evenAsync, moreThan10, moreThan10Async } from './test-mocks';
import { andTick, trackControl } from './test-utils';

function renderNumber(n: number, options?: WFormControlOptions<number>): WForm<number> {
    return wForm(() => wControl(options)).build(n);
}

function renderConditionalNumber(initial: number, anchor: number, optionsLess: WFormControlOptions<number>, optionsMore: WFormControlOptions<number>): WForm<number> {
    return wForm((value: number) => wControl(value < anchor ? optionsLess : optionsMore)).build(initial);
}

function renderDisabledConditionalNumber(initial: number, anchor: number): WForm<number> {
    return renderConditionalNumber(initial, anchor, { disabled: true }, { disabled: false });
}

describe('WFormControl', () => {
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

        describe('validator', () => {
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
    
            it('should not validate disabled control', () => {
                expect(renderNumber(null as any, { required: true, disabled: true }).control.errors).toBeFalsy();
            });
        });

        describe('async validator', () => {
            it('should not assign any async validators by default', () => {
                expect(renderNumber(1).control.asyncValidator).toBeFalsy();
            });
    
            it('should assign provided async validator', fakeAsync(() => {
                const options = { asyncValidator: moreThan10Async };

                expect(andTick(renderNumber(1, options)).control.errors).toEqual({ min: true });
                expect(andTick(renderNumber(100, options)).control.errors).toBeFalsy();
            }));
    
            it('should return merged async validation result', fakeAsync(() => {
                const options = { asyncValidator: [moreThan10Async, evenAsync] };
                expect(andTick(renderNumber(1, options)).control.errors).toEqual({ min: true, even: true });
                expect(andTick(renderNumber(4, options)).control.errors).toEqual({ min: true });
                expect(andTick(renderNumber(13, options)).control.errors).toEqual({ even: true });
                expect(andTick(renderNumber(100, options)).control.errors).toBeFalsy();
            }));
    
            it('should not run async validator for disabled control', fakeAsync(() => {
                const form = renderNumber(null as any, { asyncValidator: moreThan10Async, disabled: true });
                tick();
                expect(form.control.errors).toBeFalsy();
            }));
        });

        it('should allow both sync and async validators', fakeAsync(() => {
            const options = { validator: moreThan10, asyncValidator: evenAsync };
            expect(andTick(renderNumber(1, options)).control.errors).toEqual({ min: true });
            expect(andTick(renderNumber(4, options)).control.errors).toEqual({ min: true });
            expect(andTick(renderNumber(13, options)).control.errors).toEqual({ even: true });
            expect(andTick(renderNumber(100, options)).control.errors).toBeFalsy();
        }));

        it('should render value passed into wnode', () => {
            const form = wForm((value: number) => wControl({ value: value + 1 })).build(1 as number);

            expect(form.value).toBe(2);
        });

        it('should not mark control as dirty if corresponding tiny flag is not set', () => {
            const form = renderNumber(2, {});

            expect(form.control.dirty).toBeFalse();
        });

        it('should not mark control as dirty if corresponding tiny flag is set to false', () => {
            const form = renderNumber(2, { dirty: false });

            expect(form.control.dirty).toBeFalse();
        });

        it('should mark control as dirty if corresponding tiny flag is set to true', () => {
            const form = renderNumber(2, { dirty: true });

            expect(form.control.dirty).toBeTrue();
        });

        it('should not mark control as touched if corresponding tiny flag is not set', () => {
            const form = renderNumber(2, {});

            expect(form.control.touched).toBeFalse();
        });

        it('should not mark control as touched if corresponding tiny flag is set to false', () => {
            const form = renderNumber(2, { touched: false });

            expect(form.control.touched).toBeFalse();
        });

        it('should mark control as touched if corresponding tiny flag is set to true', () => {
            const form = renderNumber(2, { touched: true });

            expect(form.control.touched).toBeTrue();
        });

        it('should set updateOn flag to "change", by default', () => {
            const form = renderNumber(2, {});

            expect(form.control.updateOn).toBe(WFormHooks.Change);
        });

        it('should allow to set updateOn flag', () => {
            const form = renderNumber(2, { updateOn: WFormHooks.Blur });

            expect(form.control.updateOn).toBe(WFormHooks.Blur);
        });
    });

    describe('value getters', () => {
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

        it('should do nothing if disabled flag was not modified in wform tree', () => {
            const form = wForm((v: number) => wControl({ disabled: true })).build(2);
    
            const tracker = trackControl(form.control);
    
            form.update();
    
            expect(tracker.changed).toBeFalse();
        });

        describe('validator', () => {
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
    
            it('should rerender control if value was changed in meantime', () => {
                const form = renderConditionalNumber(2, 5, {}, { validator: moreThan10 });
        
                form.control.setValue(7);
        
                expect(form.control.errors).toBeFalsy();
        
                form.update();
    
                expect(form.control.errors).toEqual({ min: true });
            });
    
            it('should do nothing if validators were not changed', () => {
                const form = wForm((v: number) => wControl({ required: true, validator: [moreThan10, even] })).build(1);
        
                const tracker = trackControl(form.control);
        
                form.update();
        
                expect(tracker.changed).toBeFalse();
            });
        });

        describe('async validator', () => {
            it('should assign async validators', fakeAsync(() => {
                const form = renderConditionalNumber(2, 5, {}, { asyncValidator: moreThan10Async });
        
                tick();

                expect(form.control.errors).toBeFalsy();
        
                form.setValue(7);
        
                tick();

                expect(form.control.errors).toEqual({ min: true });
            }));
    
            it('should remove async validators', fakeAsync(() => {
                const form = renderConditionalNumber(7, 5, {}, { asyncValidator: moreThan10Async });
        
                tick();

                expect(form.control.errors).toEqual({ min: true });
        
                form.setValue(2);

                tick();
        
                expect(form.control.errors).toBeFalsy();
            }));
    
            it('should change async validators', fakeAsync(() => {
                const form = renderConditionalNumber(1, 5, { validator: moreThan10 }, { validator: [moreThan10, even] });
        
                tick();

                expect(form.control.errors).toEqual({ min: true });
        
                form.setValue(7);

                tick();
        
                expect(form.control.errors).toEqual({ min: true, even: true });
            }));
    
            it('should rerender control if value was changed in meantime', fakeAsync(() => {
                const form = renderConditionalNumber(2, 5, {}, { validator: moreThan10 });
        
                tick();

                form.control.setValue(7);
        
                expect(form.control.errors).toBeFalsy();
        
                form.update();
    
                tick();

                expect(form.control.errors).toEqual({ min: true });
            }));
    
            it('should do nothing if async validators were not changed', fakeAsync(() => {
                const form = wForm((v: number) => wControl({ required: true, validator: [moreThan10, even] })).build(1);
        
                tick();

                const tracker = trackControl(form.control);
        
                form.update();
        
                tick();

                expect(tracker.changed).toBeFalse();
            }));
        });

        it('should update value by value passed into wnode', () => {
            const form = wForm((value: number) => wControl({ value: value + 1 })).build(1 as number);

            form.setValue(10);

            expect(form.value).toBe(11);
        });

        it('should not update dirty flag if corresponding tiny flag is not set', () => {
            const form = renderConditionalNumber(2, 5, {}, {});

            form.setValue(7);

            expect(form.control.dirty).toBeFalse();

            form.control.markAsDirty();

            form.setValue(9);

            expect(form.control.dirty).toBeTrue();
        });

        it('should unset dirty flag if corresponding tiny flag is set to false', () => {
            const form = renderConditionalNumber(2, 5, {}, { dirty: false });

            form.setValue(7);

            expect(form.control.dirty).toBeFalse();

            form.control.markAsDirty();

            form.setValue(9);

            expect(form.control.dirty).toBeFalse();
        });

        it('should mark control as dirty if corresponding tiny flag is set to true', () => {
            const form = renderConditionalNumber(2, 5, {}, { dirty: true });

            form.setValue(7);

            expect(form.control.dirty).toBeTrue();

            form.control.markAsPristine();

            form.setValue(9);

            expect(form.control.dirty).toBeTrue();
        });

        it('should not update touched flag if corresponding tiny flag is not set', () => {
            const form = renderConditionalNumber(2, 5, {}, {});

            form.setValue(7);

            expect(form.control.touched).toBeFalse();

            form.control.markAsTouched();

            form.setValue(9);

            expect(form.control.touched).toBeTrue();
        });

        it('should unset touched flag if corresponding tiny flag is set to false', () => {
            const form = renderConditionalNumber(2, 5, {}, { touched: false });

            form.setValue(7);

            expect(form.control.touched).toBeFalse();

            form.control.markAsTouched();

            form.setValue(9);

            expect(form.control.touched).toBeFalse();
        });

        it('should mark control as dirty if corresponding tiny flag is set to true', () => {
            const form = renderConditionalNumber(2, 5, {}, { touched: true });

            form.setValue(7);

            expect(form.control.touched).toBeTrue();

            form.control.markAsUntouched();

            form.setValue(9);

            expect(form.control.touched).toBeTrue();
        });

        it('should not recreate underlying FormControl', () => {
            const form = renderConditionalNumber(1, 5, { validator: moreThan10 }, { validator: [moreThan10, even] });
    
            const control = form.control;
    
            form.setValue(7);
    
            expect(form.control).toBe(control);
        });

        it('should not update "updateOn" flag', () => {
            const form = renderConditionalNumber(2, 5, { updateOn: WFormHooks.Change }, { updateOn: WFormHooks.Blur });

            form.setValue(7);
            
            expect(form.control.updateOn).toBe(WFormHooks.Change);
        });
    });

    describe('getLastFormNode', () => {
        it('should return node from the latest render operation', () => {
            const node1 = wControl();
            const node2 = wControl({ validator: moreThan10 });
            const node3 = wControl({ validator: even });
            const fn = jasmine.createSpy().and.returnValues(node1, node2, node3);

            const form = wForm(fn).build(1);

            expect(getLastFormNode(form.control)).toBe(node1);

            form.update();
            expect(getLastFormNode(form.control)).toBe(node2);

            form.update();
            expect(getLastFormNode(form.control)).toBe(node3);
        });
    });

    describe('side effects', () => {
        it('should restore enabled state', () => {
            const form = renderNumber(1);

            form.control.disable();

            expect(form.control.disabled).toBeTrue();
            
            form.update();

            expect(form.control.disabled).toBeFalse();
        });

        it('should restore disabled state', () => {
            const form = renderNumber(1, { disabled: true });

            form.control.enable();

            expect(form.control.disabled).toBeFalse();
            
            form.update();

            expect(form.control.disabled).toBeTrue();
        });

        it('should do nothing if touched state is not specified', () => {
            const form = renderNumber(1);

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
            const form = renderNumber(1, { touched: false });

            form.control.markAsTouched()

            expect(form.control.touched).toBeTrue();
            
            form.update();

            expect(form.control.touched).toBeFalse();
        });

        it('should restore touched state', () => {
            const form = renderNumber(1, { touched: true });

            form.control.markAsUntouched();

            expect(form.control.touched).toBeFalse();
            
            form.update();

            expect(form.control.touched).toBeTrue();
        });

        it('should do nothing if dirty state is not specified', () => {
            const form = renderNumber(1);

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
            const form = renderNumber(1, { dirty: false });

            form.control.markAsDirty()

            expect(form.control.dirty).toBeTrue();
            
            form.update();

            expect(form.control.dirty).toBeFalse();
        });

        it('should restore dirty state', () => {
            const form = renderNumber(1, { dirty: true });

            form.control.markAsPristine();

            expect(form.control.dirty).toBeFalse();
            
            form.update();

            expect(form.control.dirty).toBeTrue();
        });
    });
});
