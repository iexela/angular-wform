import { getLastFormNode, vArray, vControl, VForm, vForm, VFormBuilder, VFormControlOptions, VFormGroupChildren, VFormGroupOptions, vGroup } from '..';
import { light, even, parcel, heavyParcel, largeParcel, heavyAndLargeParcel, moreThan10, Box, small, fragileParcel, parcelWithoutVolume, Flight, belarusToAustralia, belarusToRussia } from './test-mocks';
import { trackControl } from './test-utils';

function withVolume(box: Box, options: VFormControlOptions = {}): VFormGroupChildren {
    return withWeightAndVolume(box, {}, options);
}

function withDisabledVolume(box: Box): VFormGroupChildren {
    return withVolume(box, { disabled: true });
}

function withWeightAndVolume(box: Box, weight?: VFormControlOptions, volume?: VFormControlOptions): VFormGroupChildren {
    return {
        weight: vControl(box.weight, weight),
        volume: vControl(box.volume, volume),
    };
}

function renderGroup(initial: Box, options: VFormGroupOptions = {}, children?: VFormGroupChildren): VForm<Box> {
    return vForm((current: Box) => vGroup(options, children || withWeightAndVolume(current))).build(initial);
}

function renderConditionalGroup(initial: Box,
                                anchor: number,
                                [optionsLess, childrenLess]: [VFormGroupOptions, VFormGroupChildren?],
                                [optionsMore, childrenMore]: [VFormGroupOptions, VFormGroupChildren?]): VForm<Box> {
    return vForm((value: Box) => {
        const isLess = value.volume! < anchor;
        return vGroup(
            isLess ? optionsLess : optionsMore,
            (isLess ? childrenLess : childrenMore) || withWeightAndVolume(value),
        );
    }).build(initial);
}

function renderDisabledConditionalGroup(initial: Box, anchor: number): VForm<Box> {
    return renderConditionalGroup(initial, anchor, [{ disabled: true }], [{ disabled: false }]);
}

function flightFormBuilder(): VFormBuilder<Flight> {
    return vForm((value: Flight) => vGroup(null, {
        name: vControl(value.name),
        route: vArray(null, value.route.map(node => vControl(node))),
        cost: vGroup(null, {
            price: vControl(value.cost.price),
            discount: vControl(value.cost.discount),
        }),
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
            const form = renderGroup(parcel, {}, withWeightAndVolume(parcel));

            expect(form.getControl('weight').disabled).toBeFalse();
            expect(form.getControl('volume').disabled).toBeFalse();
        });

        it('should disable all internal controls if "disabled" is true', () => {
            const form = renderGroup(parcel, { disabled: true }, withWeightAndVolume(parcel));

            expect(form.getControl('weight').disabled).toBeTrue();
            expect(form.getControl('volume').disabled).toBeTrue();
        });

        it('should disable all internal controls if "disabled" is true (regardless internal controls disabled flag)', () => {
            const form = renderGroup(
                parcel,
                { disabled: true },
                withWeightAndVolume(parcel, { disabled: false }, { disabled: false }),
            );

            expect(form.getControl('weight').disabled).toBeTrue();
            expect(form.getControl('volume').disabled).toBeTrue();
        });

        it('should leave "disabled" state for internal controls as they desire when "disabled" is false', () => {
            const form = renderGroup(
                parcel,
                { disabled: false },
                withWeightAndVolume(parcel, { disabled: true }, { disabled: false }),
            );

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
            const form = vForm(() => vGroup({ disabled: true }, withWeightAndVolume(parcel))).build(parcel);
    
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
            expect(form.getControl('weight').disabled).toBeTrue();
            expect(form.getControl('volume').disabled).toBeTrue();
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
            expect(form.getControl('weight').disabled).toBeTrue();
            expect(form.getControl('volume').disabled).toBeFalse();
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
    
            expect(form.getControl('weight').disabled).toBeFalse();
            expect(form.getControl('volume').disabled).toBeTrue();
    
            form.setValue(largeParcel);
    
            expect(form.getControl('weight').disabled).toBeTrue();
            expect(form.getControl('volume').disabled).toBeFalse();
        });

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
            const form = vForm(() => vGroup({ validator: [small, light] }, withWeightAndVolume(parcel))).build(parcel);
    
            const tracker = trackControl(form.control);
    
            form.update();
    
            expect(tracker.changed).toBeFalse();
        });

        it('should not recreate underlying FormControl', () => {
            const form = renderConditionalGroup(parcel, 50, [{ validator: small }], [{ validator: [small, light] }]);
    
            const control = form.control;
    
            form.setValue(heavyAndLargeParcel);
    
            expect(form.control).toBe(control);
        });

        it('should create control if it appears in the vform description', () => {
            const form = renderConditionalGroup(
                parcel,
                50,
                [
                    {},
                    {
                        weight: vControl(parcel.weight),
                    },
                ],
                [
                    {},
                    {
                        weight: vControl(largeParcel.weight),
                        volume: vControl(largeParcel.volume),
                    },
                ]);
    
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
                [
                    {},
                    {
                        weight: vControl(parcel.weight),
                        volume: vControl(parcel.volume),
                    },
                ],
                [
                    {},
                    {
                        weight: vControl(largeParcel.weight),
                    },
                ]);
    
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

    describe('getLastFormNode', () => {
        it('should return node from the latest render operation', () => {
            const node1 = vGroup(withVolume(parcel));
            const node2 = vGroup(withVolume(parcel, { validator: moreThan10 }));
            const node3 = vGroup(withVolume(parcel, { validator: even }));
            const fn = jasmine.createSpy().and.returnValues(node1, node2, node3);

            const form = vForm(fn).build(parcel);

            expect(getLastFormNode(form.control)).toBe(node1);

            form.update();
            expect(getLastFormNode(form.control)).toBe(node2);

            form.update();
            expect(getLastFormNode(form.control)).toBe(node3);
        });
    });
});
