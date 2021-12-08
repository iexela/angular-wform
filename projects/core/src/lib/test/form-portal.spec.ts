import { wControl, wGroup, wPortal } from '../basic';
import { wForm } from '../builder';

describe('WFormPortal', () => {
    it('should not render control when portal is not connected', () => {
        const form = wForm(() => wGroup({
            portal: wPortal('site'),
        })).build({});

        expect(form.control.get('portal')).toBeFalsy();
    });

    it('should render root control of the form when portal is connected', () => {
        const siteForm = wForm(() => wControl()).build(1);
        const form = wForm(() => wGroup({
            portal: wPortal('site'),
        })).build({});

        form.connect('site', siteForm);
        expect(form.control.get('portal')).toBeTruthy();
    });

    it('should not render control when portal is disconnected', () => {
        const siteForm = wForm(() => wControl()).build(1);
        const form = wForm(() => wGroup({
            portal: wPortal('site'),
        })).build({});

        form.connect('site', siteForm);
        form.disconnect('site');

        expect(form.control.get('portal')).toBeFalsy();
    });

    it('should update child form on connect', () => {
        const siteForm = wForm(() => wControl()).build(1);
        const spy = spyOn(siteForm, 'update').and.callThrough();
        const form = wForm(() => wGroup({
            portal: wPortal('site'),
        })).build({ portal: 10 });

        form.connect('site', siteForm);

        expect(form.get('portal').value).toBe(1);
        expect(spy).toHaveBeenCalled();
    });

    it('should set value for the child form when setValue is called for the parent form', () => {
        const siteForm = wForm(() => wControl()).build(1);
        const spy = spyOn(siteForm, 'setValue').and.callThrough();
        const form = wForm(() => wGroup({
            portal: wPortal('site'),
        })).build({ portal: 10 });

        form.connect('site', siteForm);
        
        form.setValue({ portal: 100 });

        expect(form.get('portal').value).toBe(100);
        expect(spy).toHaveBeenCalledWith(100);
    });

    it('should set value for the child form when update is called for the parent form', () => {
        const siteForm = wForm(() => wControl()).build(1);
        const spy = spyOn(siteForm, 'setValue').and.callThrough();
        const form = wForm(() => wGroup({
            portal: wPortal('site'),
        })).build({ portal: 10 });

        form.connect('site', siteForm);
        
        form.update();

        expect(form.get('portal').value).toBe(1);
        expect(spy).toHaveBeenCalledWith(1);
    });

    it('should enable child form if parent form is enabled', () => {
        const siteForm = wForm(() => wControl()).build(1);
        const form = wForm(() => wGroup({
            portal: wPortal('site'),
        })).build({ portal: 10 });

        form.connect('site', siteForm);

        expect(siteForm.control.disabled).toBeFalse();
    });

    it('should disable child form if parent form is disabled', () => {
        const siteForm = wForm(() => wControl()).build(1);
        const form = wForm(() => wGroup({ disabled: true }, {
            portal: wPortal('site'),
        })).build({ portal: 10 });

        form.connect('site', siteForm);

        expect(siteForm.control.disabled).toBeTrue();
    });

    it('should disable child form (regardless of its "disabled" flag) if parent form is disabled', () => {
        const siteForm = wForm(() => wControl({ disabled: false })).build(1);
        const form = wForm(() => wGroup({ disabled: true }, {
            portal: wPortal('site'),
        })).build({ portal: 10 });

        form.connect('site', siteForm);

        expect(siteForm.control.disabled).toBeTrue();
    });

    it('should disable child form if it is disabled and parent form is enabled', () => {
        const siteForm = wForm(() => wControl({ disabled: true })).build(1);
        const form = wForm(() => wGroup({
            portal: wPortal('site'),
        })).build({ portal: 10 });

        form.connect('site', siteForm);

        expect(siteForm.control.disabled).toBeTrue();
    });

    it('should switch "disabled" flag from enabled to disabled, when it is changed for the parent form', () => {
        const siteForm = wForm(() => wControl()).build(1);
        const form = wForm(({ value }: { value: number }) => wGroup({ disabled: value < 0 }, {
            value: wControl(),
            portal: wPortal('site'),
        })).build({ value: 10 });

        form.connect('site', siteForm);

        expect(siteForm.control.disabled).toBeFalse();
        
        form.setValue({ value: -10 });

        expect(siteForm.control.disabled).toBeTrue();
    });

    it('should switch "disabled" flag from disabled to enabled, when it is changed for the parent form', () => {
        const siteForm = wForm(() => wControl()).build(1);
        const form = wForm(({ value }: { value: number }) => wGroup({ disabled: value < 0 }, {
            value: wControl(),
            portal: wPortal('site'),
        })).build({ value: -10 });

        form.connect('site', siteForm);

        expect(siteForm.control.disabled).toBeTrue();
        
        form.setValue({ value: 10 });

        expect(siteForm.control.disabled).toBeFalse();
    });
});
