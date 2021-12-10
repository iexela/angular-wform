import { AbstractControl, FormArray, FormControl, FormGroup } from '@angular/forms';
import { AsFormControlPipe } from './as-form-control.pipe';
import { AsFormArrayPipe } from './as-form-array.pipe';
import { AsFormGroupPipe } from './as-form-group.pipe';

const control: AbstractControl = new FormControl();
const group: AbstractControl = new FormGroup({});
const array: AbstractControl = new FormArray([]);

describe('asForm*', () => {
    describe('asFormControl', () => {
        it('should convert control to FormControl', () => {
            const pipe = new AsFormControlPipe();
            expect(pipe.transform(control)).toBe(control as FormControl);
        });

        it('should throw error if control is FormArray', () => {
            const pipe = new AsFormControlPipe();
            expect(() => pipe.transform(group)).toThrow();
        });

        it('should throw error if control is FormGroup', () => {
            const pipe = new AsFormControlPipe();
            expect(() => pipe.transform(array)).toThrow();
        });

        it('should throw error if control is nil', () => {
            const pipe = new AsFormControlPipe();
            expect(() => pipe.transform(null)).toThrow();
            expect(() => pipe.transform(undefined)).toThrow();
        });
    });

    describe('asFormArray', () => {
        it('should convert control to FormArray', () => {
            const pipe = new AsFormArrayPipe();
            expect(pipe.transform(array)).toBe(array as FormArray);
        });

        it('should throw error if control is FormControl', () => {
            const pipe = new AsFormArrayPipe();
            expect(() => pipe.transform(control)).toThrow();
        });

        it('should throw error if control is FormGroup', () => {
            const pipe = new AsFormArrayPipe();
            expect(() => pipe.transform(group)).toThrow();
        });

        it('should throw error if control is nil', () => {
            const pipe = new AsFormArrayPipe();
            expect(() => pipe.transform(null)).toThrow();
            expect(() => pipe.transform(undefined)).toThrow();
        });
    });

    describe('asFormGroup', () => {
        it('should convert control to FormGroup', () => {
            const pipe = new AsFormGroupPipe();
            expect(pipe.transform(group)).toBe(group as FormGroup);
        });

        it('should throw error if control is FormControl', () => {
            const pipe = new AsFormGroupPipe();
            expect(() => pipe.transform(control)).toThrow();
        });

        it('should throw error if control is FormArray', () => {
            const pipe = new AsFormGroupPipe();
            expect(() => pipe.transform(array)).toThrow();
        });

        it('should throw error if control is nil', () => {
            const pipe = new AsFormGroupPipe();
            expect(() => pipe.transform(null)).toThrow();
            expect(() => pipe.transform(undefined)).toThrow();
        });
    });
});
