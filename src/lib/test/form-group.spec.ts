import { getFormNode, vArray, vControl, VForm, vForm, VFormBuilder, VFormControlOptions, VFormGroupOptions, vGroup } from '..';
import { light, even, parcel, heavyParcel, largeParcel, heavyAndLargeParcel, moreThan10, Box, small, fragileParcel, parcelWithoutVolume, Flight, belarusToAustralia, belarusToRussia } from './test-mocks';
import { trackControl } from './test-utils';

function withVolume(options: VFormControlOptions = {}): VFormGroupOptions {
    return withWeightAndVolume({}, options);
}

function withDisabledVolume(): VFormGroupOptions {
    return withVolume({ disabled: true });
}

function withWeightAndVolume(weight?: VFormControlOptions, volume?: VFormControlOptions): VFormGroupOptions {
    return {
        children: {
            weight: vControl(weight),
            volume: vControl(volume),
        },
    };
}

function renderGroup(initial: Box, options?: VFormGroupOptions): VForm<Box> {
    return vForm(() => vGroup({
        ...withWeightAndVolume(),
        ...options,
    })).build(initial);
}

function renderConditionalGroup(initial: Box, anchor: number, optionsLess: VFormGroupOptions, optionsMore: VFormGroupOptions): VForm<Box> {
    return vForm((value: Box) => vGroup({
        ...withWeightAndVolume(),
        ...value.volume! < anchor ? optionsLess : optionsMore,
    })).build(initial);
}

function renderDisabledConditionalGroup(initial: Box, anchor: number): VForm<Box> {
    return renderConditionalGroup(initial, anchor, { disabled: true }, { disabled: false });
}

function flightFormBuilder(): VFormBuilder<Flight> {
    return vForm((value: Flight) => vGroup({
        children: {
            name: vControl(),
            route: vArray({
                children: value.route.map(node => vControl({ key: node })),
            }),
            cost: vGroup({
                children: {
                    price: vControl(),
                    discount: vControl(),
                },
            }),
        },
    }))
}

describe('VFormGroup', () => {
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
            const form = renderGroup(parcel, {
                ...withWeightAndVolume(),
            });

            expect(form.getControl('weight').disabled).toBeFalse();
            expect(form.getControl('volume').disabled).toBeFalse();
        });

        it('should disable all internal controls if "disabled" is true', () => {
            const form = renderGroup(parcel, {
                disabled: true,
                ...withWeightAndVolume(),
            });

            expect(form.getControl('weight').disabled).toBeTrue();
            expect(form.getControl('volume').disabled).toBeTrue();
        });

        it('should disable all internal controls if "disabled" is true (regardless internal controls disabled flag)', () => {
            const form = renderGroup(parcel, {
                disabled: true,
                ...withWeightAndVolume({ disabled: false }, { disabled: false }),
            });

            expect(form.getControl('weight').disabled).toBeTrue();
            expect(form.getControl('volume').disabled).toBeTrue();
        });

        it('should leave "disabled" state for internal controls as they desire when "disabled" is false', () => {
            const form = renderGroup(parcel, {
                disabled: false,
                ...withWeightAndVolume({ disabled: true }, { disabled: false }),
            });

            expect(form.getControl('weight').disabled).toBeTrue();
            expect(form.getControl('volume').disabled).toBeFalse();
        });

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

        it('should render nested vform containers', () => {
            const form = flightFormBuilder().build(belarusToAustralia);

            expect(form.value).toEqual(belarusToAustralia);
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
            expect(renderGroup(parcel, withDisabledVolume()).value).toEqual(parcelWithoutVolume);
        });
    
        it('should return rawValue', () => {
            expect(renderGroup(parcel).rawValue).toEqual(parcel);
        });
    
        it('should return rawValue if "disabled"', () => {
            expect(renderGroup(parcel, { disabled: true }).rawValue).toEqual(parcel);
        });
    
        it('should return rawvalue regardless disabled controls', () => {
            expect(renderGroup(parcel, withDisabledVolume()).rawValue).toEqual(parcel);
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
            expect(form.getControl('weight').disabled).toBeTrue();
            expect(form.getControl('volume').disabled).toBeTrue();
        });

        it('should switch state of control from disabled to enabled', () => {
            const form = renderDisabledConditionalGroup(parcel, 50);
    
            expect(form.control.disabled).toBeTrue();
    
            form.setValue(largeParcel);
    
            expect(form.control.disabled).toBeFalse();
            expect(form.getControl('weight').disabled).toBeFalse();
            expect(form.getControl('volume').disabled).toBeFalse();
        });

        it('should do nothing if disabled flag was not modified in vform tree', () => {
            const form = vForm(() => vGroup({ disabled: true, ...withWeightAndVolume() })).build(2);
    
            const tracker = trackControl(form.control);
    
            form.update();
    
            expect(tracker.changed).toBeFalse();
        });

        it('should disable internal controls if "disabled" flag was switched to true (regardles of "disabled" flag for internal controls)', () => {
            const form = renderConditionalGroup(
                largeParcel,
                50,
                {
                    disabled: true,
                    ...withWeightAndVolume({ disabled: false }, { disabled: true }),
                },
                {
                    disabled: false,
                    ...withWeightAndVolume({ disabled: true }, { disabled: false }),
                });
    
            expect(form.control.disabled).toBeFalse();
    
            form.setValue(parcel);
    
            expect(form.control.disabled).toBeTrue();
            expect(form.getControl('weight').disabled).toBeTrue();
            expect(form.getControl('volume').disabled).toBeTrue();
        });

        it('should respect "disabled" state of internal controls if "disabled" flag was switched to false', () => {
            const form = renderConditionalGroup(
                parcel,
                50,
                {
                    disabled: true,
                    ...withWeightAndVolume({ disabled: false }, { disabled: true }),
                },
                {
                    disabled: false,
                    ...withWeightAndVolume({ disabled: true }, { disabled: false }),
                });
    
            expect(form.control.disabled).toBeTrue();
    
            form.setValue(largeParcel);
    
            expect(form.control.disabled).toBeFalse();
            expect(form.getControl('weight').disabled).toBeTrue();
            expect(form.getControl('volume').disabled).toBeFalse();
        });

        it('should switch state of internal controls (if any) if "disabled" flag is set to false', () => {
            const form = renderConditionalGroup(
                parcel,
                50,
                {
                    ...withWeightAndVolume({ disabled: false }, { disabled: true }),
                },
                {
                    ...withWeightAndVolume({ disabled: true }, { disabled: false }),
                });
    
            expect(form.getControl('weight').disabled).toBeFalse();
            expect(form.getControl('volume').disabled).toBeTrue();
    
            form.setValue(largeParcel);
    
            expect(form.getControl('weight').disabled).toBeTrue();
            expect(form.getControl('volume').disabled).toBeFalse();
        });

        it('should assign validators', () => {
            const form = renderConditionalGroup(parcel, 50, {}, { validator: small });

            expect(form.control.errors).toBeFalsy();
    
            form.setValue(largeParcel);

            expect(form.control.errors).toEqual({ small: true });
        });

        it('should remove validators', () => {
            const form = renderConditionalGroup(largeParcel, 50, {}, { validator: small });
    
            expect(form.control.errors).toEqual({ small: true });
    
            form.setValue(parcel);
    
            expect(form.control.errors).toBeFalsy();
        });

        it('should change validators', () => {
            const form = renderConditionalGroup(heavyParcel, 50, { validator: light }, { validator: [small, light] });
    
            expect(form.control.errors).toEqual({ light: true });
    
            form.setValue(heavyAndLargeParcel);
    
            expect(form.control.errors).toEqual({ light: true, small: true });
        });

        it('should rerender control if value was changed in meantime', () => {
            const form = renderConditionalGroup(parcel, 50, {}, { validator: small });
    
            form.control.setValue(largeParcel);
    
            expect(form.control.errors).toBeFalsy();
    
            form.update();

            expect(form.control.errors).toEqual({ small: true });
        });

        it('should do nothing if validators were not changed', () => {
            const form = vForm(() => vGroup({ validator: [small, light], ...withWeightAndVolume() })).build(parcel);
    
            const tracker = trackControl(form.control);
    
            form.update();
    
            expect(tracker.changed).toBeFalse();
        });

        it('should not recreate underlying FormControl', () => {
            const form = renderConditionalGroup(parcel, 50, { validator: small }, { validator: [small, light] });
    
            const control = form.control;
    
            form.setValue(heavyAndLargeParcel);
    
            expect(form.control).toBe(control);
        });

        it('should create control if it appears in the vform description', () => {
            const form = renderConditionalGroup(
                parcel,
                50,
                {
                    children: {
                        weight: vControl(),
                    },
                },
                {
                    children: {
                        weight: vControl(),
                        volume: vControl(),
                    },
                });
    
            expect(form.hasControl('weight')).toBeTrue();
            expect(form.hasControl('volume')).toBeFalse();
            expect(form.value).toEqual({ weight: parcel.weight });
    
            form.setValue(largeParcel);
    
            expect(form.hasControl('weight')).toBeTrue();
            expect(form.hasControl('volume')).toBeTrue();
        });

        it('should remove control if it disappears from the vform description', () => {
            const form = renderConditionalGroup(
                parcel,
                50,
                {
                    children: {
                        weight: vControl(),
                        volume: vControl(),
                    },
                },
                {
                    children: {
                        weight: vControl(),
                    },
                });
    
            expect(form.hasControl('weight')).toBeTrue();
            expect(form.hasControl('volume')).toBeTrue();
            expect(form.value).toEqual(parcel);
            
            form.setValue(largeParcel);
            
            expect(form.hasControl('weight')).toBeTrue();
            expect(form.hasControl('volume')).toBeFalse();
            expect(form.value).toEqual({ weight: largeParcel.weight });
        });

        it('should rerender nested vform containers', () => {
            const form = flightFormBuilder().build(belarusToAustralia);

            form.setValue(belarusToRussia);

            expect(form.value).toEqual(belarusToRussia);
        });
    });

    describe('getFormNode', () => {
        it('should return node from the latest render operation', () => {
            const node1 = vGroup(withVolume());
            const node2 = vGroup(withVolume({ validator: moreThan10 }));
            const node3 = vGroup(withVolume({ validator: even }));
            const fn = jasmine.createSpy().and.returnValues(node1, node2, node3);

            const form = vForm(fn).build(parcel);

            expect(getFormNode(form.control)).toBe(node1);

            form.update();
            expect(getFormNode(form.control)).toBe(node2);

            form.update();
            expect(getFormNode(form.control)).toBe(node3);
        });
    });
});
