import { fakeAsync, tick } from '@angular/core/testing';
import { FormControl, FormGroup } from '@angular/forms';
import { wControl, WFormControlOptions, WFormGroupOptions, wGroup, wNative, wPortal, wSkip } from '../basic';
import { wForm, WFormBuilder } from '../builder';
import { WForm } from '../form';
import { WFormGroupChildren, WFormHooks } from '../model';
import { getLastFormNode } from '../reconcilation';
import { belarusToAustralia, belarusToRussia, Box, createFlightWNode, createTaxControl, elephant, even, Flight, fragileParcel, heavyAndLargeParcel, heavyParcel, largeParcel, light, lightAsync, moreThan10, mouse, parcel, parcelWithoutVolume, small, smallAsync, taxData, vTaxModel } from './test-mocks';
import { andTick, trackControl } from './test-utils';

function withVolume(box: Box, options: WFormControlOptions<number> = {}): WFormGroupChildren {
    return withWeightAndVolume(box, {}, options);
}

function withDisabledVolume(box: Box): WFormGroupChildren {
    return withVolume(box, { disabled: true });
}

function withWeightAndVolume(box: Box, weight?: WFormControlOptions<number>, volume?: WFormControlOptions<number>): WFormGroupChildren {
    return {
        weight: wControl(weight),
        volume: wControl(volume),
    };
}

function renderGroup(initial: Box, options: WFormGroupOptions = {}, children?: WFormGroupChildren): WForm<Box> {
    return wForm((current: Box) => wGroup(options, children || withWeightAndVolume(current))).lenient().build(initial);
}

function renderConditionalGroup(initial: Box,
                                anchor: number,
                                [optionsLess, childrenLess]: [WFormGroupOptions, WFormGroupChildren?],
                                [optionsMore, childrenMore]: [WFormGroupOptions, WFormGroupChildren?]): WForm<Box> {
    return wForm((value: Box) => {
        const isLess = value.volume! < anchor;
        return wGroup(
            isLess ? optionsLess : optionsMore,
            (isLess ? childrenLess : childrenMore) || withWeightAndVolume(value),
        );
    }).lenient().build(initial);
}

function renderDisabledConditionalGroup(initial: Box, anchor: number): WForm<Box> {
    return renderConditionalGroup(initial, anchor, [{ disabled: true }], [{ disabled: false }]);
}

function flightFormBuilder(): WFormBuilder<Flight> {
    return wForm(createFlightWNode);
}

describe('WFormGroup', () => {
    describe('first render', () => {
        it('should render control', () => {
            expect(renderGroup(parcel).control).toBeTruthy();
        });
    
        it('should render enabled control, by default', () => {
            expect(renderGroup(parcel).control.disabled).toBeFalse();
        });
    
        it('should render disabled control if "disabled" flag is set to "true"', () => {
            expect(renderGroup(parcel, { disabled: true }).control.disabled).toBeTrue();
        });
    
        it('should render enabled control if "disabled" flag is set to "false"', () => {
            expect(renderGroup(parcel, { disabled: false }).control.disabled).toBeFalse();
        });

        it('should enable all internal controls, by default', () => {
            const form = renderGroup(parcel, {}, withWeightAndVolume(parcel));

            expect(form.get('weight').disabled).toBeFalse();
            expect(form.get('volume').disabled).toBeFalse();
        });

        it('should disable all internal controls if "disabled" is true', () => {
            const form = renderGroup(parcel, { disabled: true }, withWeightAndVolume(parcel));

            expect(form.get('weight').disabled).toBeTrue();
            expect(form.get('volume').disabled).toBeTrue();
        });

        it('should disable all internal controls if "disabled" is true (regardless internal controls disabled flag)', () => {
            const form = renderGroup(
                parcel,
                { disabled: true },
                withWeightAndVolume(parcel, { disabled: false }, { disabled: false }),
            );

            expect(form.get('weight').disabled).toBeTrue();
            expect(form.get('volume').disabled).toBeTrue();
        });

        it('should leave "disabled" state for internal controls as they desire when "disabled" is false', () => {
            const form = renderGroup(
                parcel,
                { disabled: false },
                withWeightAndVolume(parcel, { disabled: true }, { disabled: false }),
            );

            expect(form.get('weight').disabled).toBeTrue();
            expect(form.get('volume').disabled).toBeFalse();
        });

        describe('validator', () => {
            it('should not assign any validators by default', () => {
                expect(renderGroup(parcel).control.validator).toBeFalsy();
            });
    
            it('should assign provided validator', () => {
                const options = { validator: small };
                expect(renderGroup(largeParcel, options).control.errors).toEqual({ small: true });
                expect(renderGroup(parcel, options).control.errors).toBeFalsy();
            });
    
            it('should return merged validation result', () => {
                const options = { validator: [small, light] };
                expect(renderGroup(heavyAndLargeParcel, options).control.errors).toEqual({ light: true, small: true });
                expect(renderGroup(heavyParcel, options).control.errors).toEqual({ light: true });
                expect(renderGroup(largeParcel, options).control.errors).toEqual({ small: true });
                expect(renderGroup(parcel, options).control.errors).toBeFalsy();
            });
    
            it('should not validate disabled control', () => {
                expect(renderGroup(largeParcel, { validator: small, disabled: true }).control.errors).toBeFalsy();
            });
        });

        describe('async validator', () => {
            it('should not assign any async validators by default', () => {
                expect(renderGroup(parcel).control.asyncValidator).toBeFalsy();
            });
    
            it('should assign provided async validator', fakeAsync(() => {
                const options = { asyncValidator: smallAsync };
                expect(andTick(renderGroup(largeParcel, options)).control.errors).toEqual({ small: true });
                expect(andTick(renderGroup(parcel, options)).control.errors).toBeFalsy();
            }));
    
            it('should return merged async validation result', fakeAsync(() => {
                const options = { asyncValidator: [smallAsync, lightAsync] };
                expect(andTick(renderGroup(heavyAndLargeParcel, options)).control.errors).toEqual({ light: true, small: true });
                expect(andTick(renderGroup(heavyParcel, options)).control.errors).toEqual({ light: true });
                expect(andTick(renderGroup(largeParcel, options)).control.errors).toEqual({ small: true });
                expect(andTick(renderGroup(parcel, options)).control.errors).toBeFalsy();
            }));
    
            it('should not run async validator for disabled control', fakeAsync(() => {
                const form = renderGroup(largeParcel, { asyncValidator: smallAsync, disabled: true });
                tick();
                expect(form.control.errors).toBeFalsy();
            }));
        });

        it('should allow both sync and async validators', fakeAsync(() => {
            const options = { validator: small, asyncValidator: lightAsync };
            expect(andTick(renderGroup(heavyAndLargeParcel, options)).control.errors).toEqual({ small: true });
            expect(andTick(renderGroup(heavyParcel, options)).control.errors).toEqual({ light: true });
            expect(andTick(renderGroup(largeParcel, options)).control.errors).toEqual({ small: true });
            expect(andTick(renderGroup(parcel, options)).control.errors).toBeFalsy();
        }));

        it('should render nested wform containers', () => {
            const form = flightFormBuilder().build(belarusToAustralia);

            expect(form.value).toEqual(belarusToAustralia);
        });

        it('should not mark control as dirty if corresponding tiny flag is not set', () => {
            const form = renderGroup(parcel, {});

            expect(form.control.dirty).toBeFalse();
        });

        it('should not mark control as dirty if corresponding tiny flag is set to false', () => {
            const form = renderGroup(parcel, { dirty: false });

            expect(form.control.dirty).toBeFalse();
        });

        it('should mark control as dirty if corresponding tiny flag is set to true', () => {
            const form = renderGroup(parcel, { dirty: true });

            expect(form.control.dirty).toBeTrue();
        });

        it('should not mark control as touched if corresponding tiny flag is not set', () => {
            const form = renderGroup(parcel, {});

            expect(form.control.touched).toBeFalse();
        });

        it('should not mark control as touched if corresponding tiny flag is set to false', () => {
            const form = renderGroup(parcel, { touched: false });

            expect(form.control.touched).toBeFalse();
        });

        it('should mark control as touched if corresponding tiny flag is set to true', () => {
            const form = renderGroup(parcel, { touched: true });

            expect(form.control.touched).toBeTrue();
        });

        it('should not render skipped control', () => {
            const form = wForm(() => wGroup({
                name: wControl(),
                weight: wSkip(),
                volume: wControl(),
            })).build(elephant);

            expect(form.value).toEqual({
                name: elephant.name,
                volume: elephant.volume,
            });
            expect(form.control.get('weight')).toBeFalsy();
        });

        it('should not render native control, if it is not bound', () => {
            const form = wForm((current: Box) => wGroup({
                name: wControl(),
                weight: wNative(),
                volume: wControl(),
            })).build(elephant);

            expect(form.value).toEqual({
                name: elephant.name,
                volume: elephant.volume,
            });
            expect(form.control.get('weight')).toBeFalsy();
        });

        it('should render native control, if it is bound', () => {
            const control = new FormControl(999);
            const form = wForm((current: Box) => wGroup({
                name: wControl(),
                weight: wNative(control),
                volume: wControl(),
            })).build(elephant);

            expect(form.value).toEqual(elephant);
            expect(form.control.get('weight')).toBeTruthy();
        });

        it('should not render portal control, if it is not connected', () => {
            const form = wForm((current: Box) => wGroup({
                name: wControl(),
                weight: wPortal('weight'),
                volume: wControl(),
            })).build(elephant);

            expect(form.value).toEqual({
                name: elephant.name,
                volume: elephant.volume,
            });
            expect(form.control.get('weight')).toBeFalsy();
        });

        it('should set updateOn flag to "change", by default', () => {
            const form = renderGroup(parcel, {});

            expect(form.control.updateOn).toBe(WFormHooks.Change);
            expect(form.get('volume').updateOn).toBe(WFormHooks.Change);
        });

        it('should allow to set updateOn flag', () => {
            const form = renderGroup(parcel, { updateOn: WFormHooks.Blur });

            expect(form.control.updateOn).toBe(WFormHooks.Blur);
            expect(form.get('volume').updateOn).toBe(WFormHooks.Blur);
        });

        it('should allow to redeclare updateOn flag on child level', () => {
            const form = renderGroup(parcel, { updateOn: WFormHooks.Blur }, withWeightAndVolume(parcel, {}, { updateOn: WFormHooks.Submit }));

            expect(form.control.updateOn).toBe(WFormHooks.Blur);
            expect(form.get('weight').updateOn).toBe(WFormHooks.Blur);
            expect(form.get('volume').updateOn).toBe(WFormHooks.Submit);
        });
    });

    describe('value getters', () => {
        it('should render provided value', () => {
            expect(renderGroup(parcel).value).toEqual(parcel);
        });
    
        it('should return only fields mapped to controls', () => {
            expect(renderGroup(fragileParcel).value).toEqual(parcel);
        });
    
        it('should return all fields mapped to controls', () => {
            expect(renderGroup(parcelWithoutVolume).value).toEqual({ ...parcelWithoutVolume, volume: undefined });
        });
    
        it('should return value if "disabled"', () => {
            expect(renderGroup(parcel, { disabled: true }).value).toEqual(parcel);
        });
    
        it('should return value without disabled controls', () => {
            expect(renderGroup(parcel, {}, withDisabledVolume(parcel)).value).toEqual(parcelWithoutVolume);
        });
    
        it('should return rawValue', () => {
            expect(renderGroup(parcel).rawValue).toEqual(parcel);
        });
    
        it('should return rawValue if "disabled"', () => {
            expect(renderGroup(parcel, { disabled: true }).rawValue).toEqual(parcel);
        });
    
        it('should return rawvalue regardless disabled controls', () => {
            expect(renderGroup(parcel, {}, withDisabledVolume(parcel)).rawValue).toEqual(parcel);
        });
    });

    describe('setValue', () => {
        it('should update control if it is called with different value', () => {
            const form = renderGroup(parcel);
    
            const tracker = trackControl(form.control);

            const meButOlder = { ...parcel, volume: parcel.volume + 5 };
            form.setValue(meButOlder);
    
            expect(form.value).toEqual(meButOlder);
            expect(tracker.changed).toBeTrue();
        });
    
        it('should not update control if value was not changed', () => {
            const form = renderGroup(parcel);
    
            const tracker = trackControl(form.control);
    
            form.setValue({ ...parcel });
    
            expect(tracker.changed).toBeFalse();
        });
    
        it('should not update control if unrelated field was added', () => {
            const form = renderGroup(parcel);
    
            const tracker = trackControl(form.control);
    
            form.setValue(fragileParcel);
    
            expect(tracker.changed).toBeFalse();
        });
    });

    describe('update', () => {
        it('should do nothing if it is called without changing a value', () => {
            const form = renderGroup(parcel);
    
            const tracker = trackControl(form.control);
    
            form.update();
    
            expect(tracker.changed).toBeFalse();
        });

        it('should do nothing if only value was changed', () => {
            const form = renderGroup(parcel);

            form.control.setValue(largeParcel);
    
            const tracker = trackControl(form.control);

            form.update();
    
            expect(tracker.changed).toBeFalse();
        });

        it('should do nothing if value of child control was changed', () => {
            const form = renderGroup(parcel);

            form.control.get('volume')!.setValue(parcel.volume + 5);
    
            const tracker = trackControl(form.control);

            form.update();
    
            expect(tracker.changed).toBeFalse();
        });
    });

    describe('reconcilation', () => {
        it('should switch state of control from enabled to disabled', () => {
            const form = renderDisabledConditionalGroup(largeParcel, 50);
    
            expect(form.control.disabled).toBeFalse();
    
            form.setValue(parcel);
    
            expect(form.control.disabled).toBeTrue();
            expect(form.get('weight').disabled).toBeTrue();
            expect(form.get('volume').disabled).toBeTrue();
        });

        it('should switch state of control from disabled to enabled', () => {
            const form = renderDisabledConditionalGroup(parcel, 50);
    
            expect(form.control.disabled).toBeTrue();
    
            form.setValue(largeParcel);
    
            expect(form.control.disabled).toBeFalse();
            expect(form.get('weight').disabled).toBeFalse();
            expect(form.get('volume').disabled).toBeFalse();
        });

        it('should do nothing if disabled flag was not modified in wform tree', () => {
            const form = wForm(() => wGroup({ disabled: true }, withWeightAndVolume(parcel))).build(parcel);
    
            const tracker = trackControl(form.control);
    
            form.update();
    
            expect(tracker.changed).toBeFalse();
        });

        it('should disable internal controls if "disabled" flag was switched to true (regardles of "disabled" flag for internal controls)', () => {
            const form = renderConditionalGroup(
                largeParcel,
                50,
                [
                    { disabled: true },
                    withWeightAndVolume(parcel, { disabled: false }, { disabled: true }),
                ],
                [
                    { disabled: false },
                    withWeightAndVolume(largeParcel, { disabled: true }, { disabled: false }),
                ]);
    
            expect(form.control.disabled).toBeFalse();
    
            form.setValue(parcel);
    
            expect(form.control.disabled).toBeTrue();
            expect(form.get('weight').disabled).toBeTrue();
            expect(form.get('volume').disabled).toBeTrue();
        });

        it('should respect "disabled" state of internal controls if "disabled" flag was switched to false', () => {
            const form = renderConditionalGroup(
                parcel,
                50,
                [
                    { disabled: true },
                    withWeightAndVolume(parcel, { disabled: false }, { disabled: true }),
                ],
                [
                    { disabled: false },
                    withWeightAndVolume(largeParcel, { disabled: true }, { disabled: false }),
                ]);
    
            expect(form.control.disabled).toBeTrue();
    
            form.setValue(largeParcel);
    
            expect(form.control.disabled).toBeFalse();
            expect(form.get('weight').disabled).toBeTrue();
            expect(form.get('volume').disabled).toBeFalse();
        });

        it('should switch state of internal controls (if any) if "disabled" flag is set to false', () => {
            const form = renderConditionalGroup(
                parcel,
                50,
                [
                    {},
                    withWeightAndVolume(parcel, { disabled: false }, { disabled: true }),
                ],
                [
                    {},
                    withWeightAndVolume(largeParcel, { disabled: true }, { disabled: false }),
                ]);
    
            expect(form.get('weight').disabled).toBeFalse();
            expect(form.get('volume').disabled).toBeTrue();
    
            form.setValue(largeParcel);
    
            expect(form.get('weight').disabled).toBeTrue();
            expect(form.get('volume').disabled).toBeFalse();
        });

        describe('validator', () => {
            it('should assign validators', () => {
                const form = renderConditionalGroup(parcel, 50, [{}], [{ validator: small }]);
    
                expect(form.control.errors).toBeFalsy();
        
                form.setValue(largeParcel);
    
                expect(form.control.errors).toEqual({ small: true });
            });
    
            it('should remove validators', () => {
                const form = renderConditionalGroup(largeParcel, 50, [{}], [{ validator: small }]);
        
                expect(form.control.errors).toEqual({ small: true });
        
                form.setValue(parcel);
        
                expect(form.control.errors).toBeFalsy();
            });
    
            it('should change validators', () => {
                const form = renderConditionalGroup(heavyParcel, 50, [{ validator: light }], [{ validator: [small, light] }]);
        
                expect(form.control.errors).toEqual({ light: true });
        
                form.setValue(heavyAndLargeParcel);
        
                expect(form.control.errors).toEqual({ light: true, small: true });
            });
    
            it('should rerender control if value was changed in meantime', () => {
                const form = renderConditionalGroup(parcel, 50, [{}], [{ validator: small }]);
        
                form.control.setValue(largeParcel);
        
                expect(form.control.errors).toBeFalsy();
        
                form.update();
    
                expect(form.control.errors).toEqual({ small: true });
            });
    
            it('should do nothing if validators were not changed', () => {
                const form = wForm(() => wGroup({ validator: [small, light] }, withWeightAndVolume(parcel))).build(parcel);
        
                const tracker = trackControl(form.control);
        
                form.update();
        
                expect(tracker.changed).toBeFalse();
            });
        });

        describe('async validator', () => {
            it('should assign async validators', fakeAsync(() => {
                const form = renderConditionalGroup(parcel, 50, [{}], [{ asyncValidator: smallAsync }]);
    
                tick();

                expect(form.control.errors).toBeFalsy();
        
                form.setValue(largeParcel);
    
                tick();

                expect(form.control.errors).toEqual({ small: true });
            }));
    
            it('should remove async validators', fakeAsync(() => {
                const form = renderConditionalGroup(largeParcel, 50, [{}], [{ asyncValidator: smallAsync }]);
        
                tick();

                expect(form.control.errors).toEqual({ small: true });
        
                form.setValue(parcel);
        
                tick();

                expect(form.control.errors).toBeFalsy();
            }));
    
            it('should change async validators', fakeAsync(() => {
                const form = renderConditionalGroup(heavyParcel, 50, [{ asyncValidator: lightAsync }], [{ asyncValidator: [smallAsync, lightAsync] }]);
        
                tick();

                expect(form.control.errors).toEqual({ light: true });
        
                form.setValue(heavyAndLargeParcel);
        
                tick();

                expect(form.control.errors).toEqual({ light: true, small: true });
            }));
    
            it('should rerender control if value was changed in meantime', fakeAsync(() => {
                const form = renderConditionalGroup(parcel, 50, [{}], [{ asyncValidator: smallAsync }]);
        
                form.control.setValue(largeParcel);

                tick();
        
                expect(form.control.errors).toBeFalsy();
        
                form.update();

                tick();
    
                expect(form.control.errors).toEqual({ small: true });
            }));
    
            it('should do nothing if async validators were not changed', fakeAsync(() => {
                const form = wForm(() => wGroup({ asyncValidator: [smallAsync, lightAsync] }, withWeightAndVolume(parcel))).build(parcel);
        
                tick();

                const tracker = trackControl(form.control);
        
                form.update();

                tick();
        
                expect(tracker.changed).toBeFalse();
            }));
        });

        it('should not update dirty flag if corresponding tiny flag is not set', () => {
            const form = renderConditionalGroup(parcel, 50, [{}], [{}]);

            form.setValue(largeParcel);

            expect(form.control.dirty).toBeFalse();

            form.control.markAsDirty();

            form.setValue(heavyAndLargeParcel);

            expect(form.control.dirty).toBeTrue();
        });

        it('should unset dirty flag if corresponding tiny flag is set to false', () => {
            const form = renderConditionalGroup(parcel, 50, [{}], [{ dirty: false }]);

            form.setValue(largeParcel);

            expect(form.control.dirty).toBeFalse();

            form.control.markAsDirty();

            form.setValue(heavyAndLargeParcel);

            expect(form.control.dirty).toBeFalse();
        });

        it('should mark control as dirty if corresponding tiny flag is set to true', () => {
            const form = renderConditionalGroup(parcel, 50, [{}], [{ dirty: true }]);

            form.setValue(largeParcel);

            expect(form.control.dirty).toBeTrue();

            form.control.markAsPristine();

            form.setValue(heavyAndLargeParcel);

            expect(form.control.dirty).toBeTrue();
        });

        it('should not update touched flag if corresponding tiny flag is not set', () => {
            const form = renderConditionalGroup(parcel, 50, [{}], [{}]);

            form.setValue(largeParcel);

            expect(form.control.touched).toBeFalse();

            form.control.markAsTouched();

            form.setValue(heavyAndLargeParcel);

            expect(form.control.touched).toBeTrue();
        });

        it('should unset touched flag if corresponding tiny flag is set to false', () => {
            const form = renderConditionalGroup(parcel, 50, [{}], [{ touched: false }]);

            form.setValue(largeParcel);

            expect(form.control.touched).toBeFalse();

            form.control.markAsTouched();

            form.setValue(heavyAndLargeParcel);

            expect(form.control.touched).toBeFalse();
        });

        it('should mark control as dirty if corresponding tiny flag is set to true', () => {
            const form = renderConditionalGroup(parcel, 50, [{}], [{ touched: true }]);

            form.setValue(largeParcel);

            expect(form.control.touched).toBeTrue();

            form.control.markAsUntouched();

            form.setValue(heavyAndLargeParcel);

            expect(form.control.touched).toBeTrue();
        });

        it('should not recreate underlying FormControl', () => {
            const form = renderConditionalGroup(parcel, 50, [{ validator: small }], [{ validator: [small, light] }]);
    
            const control = form.control;
    
            form.setValue(heavyAndLargeParcel);
    
            expect(form.control).toBe(control);
        });

        it('should create control if it appears in the wform description', () => {
            const form = renderConditionalGroup(
                parcel,
                50,
                [
                    {},
                    {
                        weight: wControl(),
                    },
                ],
                [
                    {},
                    {
                        weight: wControl(),
                        volume: wControl(),
                    },
                ]);
    
            expect(form.has('weight')).toBeTrue();
            expect(form.has('volume')).toBeFalse();
            expect(form.value).toEqual({ weight: parcel.weight });
    
            form.setValue(largeParcel);
    
            expect(form.has('weight')).toBeTrue();
            expect(form.has('volume')).toBeTrue();
        });

        it('should remove control if it disappears from the wform description', () => {
            const form = renderConditionalGroup(
                parcel,
                50,
                [
                    {},
                    {
                        weight: wControl(),
                        volume: wControl(),
                    },
                ],
                [
                    {},
                    {
                        weight: wControl(),
                    },
                ]);
    
            expect(form.has('weight')).toBeTrue();
            expect(form.has('volume')).toBeTrue();
            expect(form.value).toEqual(parcel);
            
            form.setValue(largeParcel);
            
            expect(form.has('weight')).toBeTrue();
            expect(form.has('volume')).toBeFalse();
            expect(form.value).toEqual({ weight: largeParcel.weight });
        });

        it('should add control if it is switched from vSkip', () => {
            const form = wForm((current: Box) => wGroup({
                name: wControl(),
                weight: current.weight! < 50 ? wSkip() : wControl(),
                volume: wControl(),
            })).build(mouse);

            expect(form.control.get('weight')).toBeFalsy();
            
            form.setValue(elephant);

            expect(form.control.get('weight')).toBeTruthy();
        });

        it('should remove control if it is switched to vSkip', () => {
            const form = wForm((current: Box) => wGroup({
                name: wControl(),
                weight: current.weight! < 50 ? wSkip() : wControl(),
                volume: wControl(),
            })).build(elephant);

            expect(form.control.get('weight')).toBeTruthy();
            
            form.setValue(mouse);

            expect(form.control.get('weight')).toBeFalsy();
        });

        it('should add native control, if it is switched to bind', () => {
            const control = new FormControl(999);
            const form = wForm((current: Box) => wGroup({
                name: wControl(),
                weight: wNative(current.weight! < 50 ? undefined : control),
                volume: wControl(),
            })).build(mouse);

            expect(form.control.get('weight')).toBeFalsy();
            expect(form.value).toEqual({ name: mouse.name, volume: mouse.volume });
            
            form.setValue(elephant);

            expect(form.control.get('weight')).toBeTruthy();
            expect(form.value).toEqual(elephant);
        });

        it('should remove native control, if it is switched to unbind', () => {
            const control = new FormControl(999);
            const form = wForm((current: Box) => wGroup({
                name: wControl(),
                weight: wNative(current.weight! < 50 ? undefined : control),
                volume: wControl(),
            })).build(elephant);

            expect(form.control.get('weight')).toBeTruthy();
            expect(form.value).toEqual(elephant);
            
            form.setValue(mouse);
            
            expect(form.control.get('weight')).toBeFalsy();
            expect(form.value).toEqual({ name: mouse.name, volume: mouse.volume });
        });

        it('should add portal control, if it was connected', () => {
            const weightForm = wForm(() => wControl()).build(elephant.weight);
            const form = wForm((current: Box) => wGroup({
                name: wControl(),
                weight: wPortal('weight'),
                volume: wControl(),
            })).build(elephant);

            form.connect('weight', weightForm);

            expect(form.value).toEqual(elephant);
            expect(form.control.get('weight')).toBe(weightForm.control);
        });

        it('should remove portal control, if it was disconnected', () => {
            const weightForm = wForm(() => wControl()).build(elephant.weight);
            const form = wForm((current: Box) => wGroup({
                name: wControl(),
                weight: wPortal('weight'),
                volume: wControl(),
            })).build(elephant);

            form.connect('weight', weightForm);
            form.disconnect('weight');

            expect(form.value).toEqual({
                name: elephant.name,
                volume: elephant.volume,
            });
            expect(form.control.get('weight')).toBeFalsy();
        });

        it('should rerender nested wform containers', () => {
            const form = flightFormBuilder().build(belarusToAustralia);

            form.setValue(belarusToRussia);

            expect(form.value).toEqual(belarusToRussia);
        });

        it('should not update "updateOn" flag', () => {
            const form = renderConditionalGroup(
                parcel,
                50,
                [{ updateOn: WFormHooks.Change }],
                [{ updateOn: WFormHooks.Blur }]);

            form.setValue(largeParcel);
            
            expect(form.control.updateOn).toBe(WFormHooks.Change);
        });
    });

    describe('getLastFormNode', () => {
        it('should return node from the latest render operation', () => {
            const node1 = wGroup(withVolume(parcel));
            const node2 = wGroup(withVolume(parcel, { validator: moreThan10 }));
            const node3 = wGroup(withVolume(parcel, { validator: even }));
            const fn = jasmine.createSpy().and.returnValues(node1, node2, node3);

            const form = wForm(fn).build(parcel);

            expect(getLastFormNode(form.control)).toBe(node1);

            form.update();
            expect(getLastFormNode(form.control)).toBe(node2);

            form.update();
            expect(getLastFormNode(form.control)).toBe(node3);
        });
    });

    describe('side effects', () => {
        it('should restore enabled state', () => {
            const form = renderGroup(parcel);

            form.control.disable();

            expect(form.control.disabled).toBeTrue();
            
            form.update();

            expect(form.control.disabled).toBeFalse();
        });

        it('should restore disabled state', () => {
            const form = renderGroup(parcel, { disabled: true });

            form.control.enable();

            expect(form.control.disabled).toBeFalse();
            
            form.update();

            expect(form.control.disabled).toBeTrue();
        });

        it('should do nothing if touched state is not specified', () => {
            const form = renderGroup(parcel);

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
            const form = renderGroup(parcel, { touched: false });

            form.control.markAsTouched()

            expect(form.control.touched).toBeTrue();
            
            form.update();

            expect(form.control.touched).toBeFalse();
        });

        it('should restore touched state', () => {
            const form = renderGroup(parcel, { touched: true });

            form.control.markAsUntouched();

            expect(form.control.touched).toBeFalse();
            
            form.update();

            expect(form.control.touched).toBeTrue();
        });

        it('should do nothing if dirty state is not specified', () => {
            const form = renderGroup(parcel);

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
            const form = renderGroup(parcel, { dirty: false });

            form.control.markAsDirty()

            expect(form.control.dirty).toBeTrue();
            
            form.update();

            expect(form.control.dirty).toBeFalse();
        });

        it('should restore dirty state', () => {
            const form = renderGroup(parcel, { dirty: true });

            form.control.markAsPristine();

            expect(form.control.dirty).toBeFalse();
            
            form.update();

            expect(form.control.dirty).toBeTrue();
        });

        it('should remove not specified controls', () => {
            const form = renderGroup(parcel);

            const group = form.control as FormGroup;

            expect(group.get('tax')).toBeFalsy();

            group.setControl('tax', createTaxControl());

            expect(group.get('tax')).toBeTruthy();

            form.update();

            expect(group.get('tax')).toBeFalsy();
        });

        it('should leave control if it was specified', () => {
            const form = renderConditionalGroup(
                parcel,
                50,
                [
                    {},
                    withWeightAndVolume(parcel)],
                [
                    {},
                    {
                        ...withWeightAndVolume(largeParcel),
                        tax: vTaxModel,
                    },
                ]);

                const group = form.control as FormGroup;
                
                expect(group.get('tax')).toBeFalsy();

                const taxControl = createTaxControl();

                group.setControl('tax', taxControl);
    
                expect(group.get('tax')).toBeTruthy();
    
                form.setValue(largeParcel);
    
                expect(group.get('tax')).toBe(taxControl);
                expect(taxControl.value).toEqual(taxData);
        });
    });
});
