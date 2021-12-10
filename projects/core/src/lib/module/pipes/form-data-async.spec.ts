import { ChangeDetectorRef, Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl } from '@angular/forms';
import { wControl, wGroup } from '../../basic';
import { wForm } from '../../builder';
import { FormDataAsyncPipe } from './form-data-async.pipe';

@Component({
    selector: 'wform-test',
    template: '',
})
class TestComponent {

}

describe('formDataAsync', () => {
    let changeDetectorRef: ChangeDetectorRef;

    beforeEach(() => {
        const fixture = TestBed.createComponent(TestComponent);
        changeDetectorRef = fixture.debugElement.injector.get(ChangeDetectorRef);
    });

    it('should throw error if control is nil', () => {
        const pipe = new FormDataAsyncPipe(changeDetectorRef);
        expect(() => pipe.transform(null as any)).toThrow();
        expect(() => pipe.transform(undefined as any)).toThrow();
    });

    it('should throw error if control is not bound to form', () => {
        const pipe = new FormDataAsyncPipe(changeDetectorRef);
        expect(() => pipe.transform(new FormControl())).toThrow();
    });
    
    it('should return wnode data', () => {
        const pipe = new FormDataAsyncPipe(changeDetectorRef);
        const form = wForm(() => wControl({ data: { value: 12 }})).build(1);
        expect(pipe.transform(form.control)).toEqual({ value: 12 });
    });

    it('should return last wnode data', () => {
        const pipe = new FormDataAsyncPipe(changeDetectorRef);
        const form = wForm((value: number) => wControl({ data: { value: value * value }})).build(2);

        pipe.transform(form.control);

        form.setValue(7);
        expect(pipe.transform(form.control)).toEqual({ value: 49 });

        form.setValue(9);
        expect(pipe.transform(form.control)).toEqual({ value: 81 });
    });

    it('should return wnode data of new control', () => {
        const pipe = new FormDataAsyncPipe(changeDetectorRef);
        const form = wForm(() => wGroup({
            a: wControl({ data: { value: 12 }}),
            b: wControl({ data: { value: 17 }}),
        })).build({ a: 1, b: 2 });

        pipe.transform(form.get('a'));

        expect(pipe.transform(form.get('b'))).toEqual({ value: 17 });
    });

    it('should return last wnode data of new control', () => {
        const pipe = new FormDataAsyncPipe(changeDetectorRef);
        const form = wForm(({ a, b }: { a: number, b: number }) => wGroup({
            a: wControl({ data: { value: a * a }}),
            b: wControl({ data: { value: b * b * b }}),
        })).build({ a: 1, b: 2 });

        pipe.transform(form.get('a'));

        form.setValue({ a: 3, b: 4 });
        expect(pipe.transform(form.get('b'))).toEqual({ value: 64 });

        form.setValue({ a: 5, b: 6 });
        expect(pipe.transform(form.get('b'))).toEqual({ value: 216 });
    });
});
