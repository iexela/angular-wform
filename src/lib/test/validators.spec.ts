import { AbstractControl, ValidatorFn } from '@angular/forms';
import { vCompoundValidator, vControl, vForm, vValidator, vValidatorFactory } from '..';

const testValidator1 = () => null;
const testValidator2 = () => null;
const testValidator3 = () => null;
const testValidator4 = () => null;
const testValidator5 = () => null;

function trackValidators(control: AbstractControl) {
    const add = spyOn(control, 'addValidators');
    const remove = spyOn(control, 'removeValidators');
    const clear = spyOn(control, 'clearValidators');
    const set = spyOn(control, 'setValidators');

    return {
        expectNotChanged: () => {
            expect(add).not.toHaveBeenCalled();
            expect(remove).not.toHaveBeenCalled();
            expect(clear).not.toHaveBeenCalled();
            expect(set).not.toHaveBeenCalled();
        },
    };
}

type V3 = (a: number, b: string, c: boolean) => ValidatorFn;

describe('validators', () => {
    describe('simple', () => {
        describe('first render', () => {
            it('should assign validator', () => {
                const form = vForm(() => vControl({
                    validator: vValidator(testValidator1),
                })).build(5);

                expect(form.control.hasValidator(testValidator1)).toBeTrue();
            });
        });

        describe('reconcilation', () => {
            it('should assign validator', () => {
                const form = vForm((n: number) => vControl({
                    validator: n < 10 ? undefined : vValidator(testValidator1),
                })).build<number>(5);

                form.setValue(20);

                expect(form.control.hasValidator(testValidator1)).toBeTrue();
            });

            it('should remove validator', () => {
                const form = vForm((n: number) => vControl({
                    validator: n < 10 ? vValidator(testValidator1) : undefined,
                })).build<number>(5);

                form.setValue(20);

                expect(form.control.hasValidator(testValidator1)).toBeFalse();
            });

            it('should not change validator if validator function was not modified', () => {
                const form = vForm(() => vControl({
                    validator: vValidator(testValidator1),
                })).build<number>(5);

                const tracker = trackValidators(form.control);

                form.setValue(20);

                expect(form.control.hasValidator(testValidator1)).toBeTrue();
                tracker.expectNotChanged();
            });

            it('should change validator if validator function was modified', () => {
                const form = vForm((n: number) => vControl({
                    validator: n < 10 ? vValidator(testValidator1) : vValidator(testValidator2),
                })).build<number>(5);

                form.setValue(20);

                expect(form.control.hasValidator(testValidator1)).toBeFalse();
                expect(form.control.hasValidator(testValidator2)).toBeTrue();
            });

            it('should not change validator if locals are empty', () => {
                const form = vForm((n: number) => vControl({
                    validator: n < 10 ? vValidator(testValidator1, []) : vValidator(testValidator2, []),
                })).build<number>(5);

                const tracker = trackValidators(form.control);

                form.setValue(20);

                expect(form.control.hasValidator(testValidator1)).toBeTrue();
                tracker.expectNotChanged();
            });

            it('should not change validator if locals are the same', () => {
                const form = vForm((n: number) => vControl({
                    validator: n < 10 ? vValidator(testValidator1, [1, 'abc']) : vValidator(testValidator2, [1, 'abc']),
                })).build<number>(5);

                const tracker = trackValidators(form.control);

                form.setValue(20);

                expect(form.control.hasValidator(testValidator1)).toBeTrue();
                tracker.expectNotChanged();
            });

            it('should change validator if locals are different', () => {
                const form = vForm((n: number) => vControl({
                    validator: n < 10 ? vValidator(testValidator1, [1, 'abc']) : vValidator(testValidator2, [2, 'abc']),
                })).build<number>(5);

                form.setValue(20);

                expect(form.control.hasValidator(testValidator1)).toBeFalse();
                expect(form.control.hasValidator(testValidator2)).toBeTrue();
            });

            it('should assign another validator if node type of validator was changed', () => {
                const form = vForm((n: number) => vControl({
                    validator: n < 10
                        ? vValidator(testValidator1, [1, 'abc'])
                        : vValidatorFactory(() => testValidator2)(),
                })).build<number>(5);

                form.setValue(20);

                expect(form.control.hasValidator(testValidator1)).toBeFalse();
                expect(form.control.hasValidator(testValidator2)).toBeTrue();
            });
        });
    });

    describe('factory', () => {
        describe('first render', () => {
            it('should assign created validator', () => {
                const form = vForm(() => vControl({
                    validator: vValidatorFactory(() => testValidator1)(),
                })).build(5);

                expect(form.control.hasValidator(testValidator1)).toBeTrue();
            });

            it('should create validator with specified arguments and assign it to control', () => {
                const factory = jasmine.createSpy<V3>().and.returnValue(testValidator1);

                const form = vForm(() => vControl({
                    validator: vValidatorFactory(factory)(1, 'abc', true),
                })).build(5);

                expect(form.control.hasValidator(testValidator1)).toBeTrue();
                expect(factory).toHaveBeenCalledOnceWith(1, 'abc', true);
            });
        });

        describe('reconcilation', () => {
            it('should assign new validator by creating it with specified arguments', () => {
                const factory = jasmine.createSpy<V3>().and.returnValues(testValidator1);

                const form = vForm((n: number) => vControl({
                    validator: n < 10 ? undefined : vValidatorFactory(factory)(1, 'abc', true),
                })).build<number>(5);

                form.setValue(20);

                expect(form.control.hasValidator(testValidator1)).toBeTrue();
                expect(factory).toHaveBeenCalledOnceWith(1, 'abc', true);
            });

            it('should remove validator', () => {
                const factory = jasmine.createSpy<V3>().and.returnValues(testValidator1);

                const form = vForm((n: number) => vControl({
                    validator: n < 10 ? vValidatorFactory(factory)(1, 'abc', true) : undefined,
                })).build<number>(5);

                form.setValue(20);

                expect(form.control.hasValidator(testValidator1)).toBeFalse();
            });

            it('should not recreate validator if arguments are the same', () => {
                const factory = jasmine.createSpy<V3>().and.returnValues(testValidator1);

                const form = vForm(() => vControl({
                    validator: vValidatorFactory(factory)(1, 'abc', true),
                })).build<number>(5);

                const tracker = trackValidators(form.control);

                form.setValue(20);

                expect(form.control.hasValidator(testValidator1)).toBeTrue();
                expect(factory).toHaveBeenCalledOnceWith(1, 'abc', true);
                tracker.expectNotChanged();
            });

            it('should recreate validator if arguments are different', () => {
                const factory = jasmine.createSpy<V3>().and.returnValues(testValidator1, testValidator2);

                const form = vForm((n: number) => vControl({
                    validator: n < 10 ? vValidatorFactory(factory)(1, 'abc', true) : vValidatorFactory(factory)(1, 'abc', false),
                })).build<number>(5);

                form.setValue(20);

                expect(form.control.hasValidator(testValidator2)).toBeTrue();
                expect(factory).toHaveBeenCalledWith(1, 'abc', false);
                expect(factory).toHaveBeenCalledTimes(2);
            });

            it('should recreate validator if factory function was modified', () => {
                const factory1 = jasmine.createSpy<V3>().and.returnValues(testValidator1);
                const factory2 = jasmine.createSpy<V3>().and.returnValues(testValidator2);

                const form = vForm((n: number) => vControl({
                    validator: n < 10 ? vValidatorFactory(factory1)(1, 'abc', false) : vValidatorFactory(factory2)(1, 'abc', false),
                })).build<number>(5);

                form.setValue(20);

                expect(form.control.hasValidator(testValidator2)).toBeTrue();
                expect(factory1).toHaveBeenCalledWith(1, 'abc', false);
                expect(factory2).toHaveBeenCalledWith(1, 'abc', false);
                expect(factory1).toHaveBeenCalledTimes(1);
                expect(factory2).toHaveBeenCalledTimes(1);
            });

            it('should assign another validator if node type of validator was changed', () => {
                const form = vForm((n: number) => vControl({
                    validator: n < 10
                        ? vValidatorFactory(() => testValidator1)()
                        : vValidator(testValidator2, [1, 'abc']),
                })).build<number>(5);

                form.setValue(20);

                expect(form.control.hasValidator(testValidator1)).toBeFalse();
                expect(form.control.hasValidator(testValidator2)).toBeTrue();
            });
        });
    });

    describe('compound', () => {
        describe('first render', () => {
            it('should call mixer function with validators created by child validation nodes', () => {
                const factory = jasmine.createSpy();
                const compoundValidator = vCompoundValidator(factory);
                
                vForm(() => vControl({
                    validator: compoundValidator(
                        vValidatorFactory(() => testValidator1)(),
                        vValidator(testValidator2),
                        testValidator3,
                    ),
                })).build(5);
                
                expect(factory).toHaveBeenCalledOnceWith([testValidator1, testValidator2, testValidator3]);
            });

            it('should assign to control all retrieved validators', () => {
                const factory = jasmine.createSpy().and.returnValue([testValidator4, testValidator5]);
                const compoundValidator = vCompoundValidator(factory);
                
                const form = vForm(() => vControl({
                    validator: compoundValidator(testValidator1),
                })).build(5);

                expect(form.control.hasValidator(testValidator1)).toBeFalse();
                expect(form.control.hasValidator(testValidator4)).toBeTrue();
                expect(form.control.hasValidator(testValidator5)).toBeTrue();
            });
        });

        describe('reconcilation', () => {
            it('should assign new validators by creating them from child validators', () => {
                const factory = jasmine.createSpy().and.returnValue([testValidator4, testValidator5]);
                const compoundValidator = vCompoundValidator(factory);
                
                const form = vForm((n: number) => vControl({
                    validator: n < 10 ? undefined : compoundValidator(
                        vValidatorFactory(() => testValidator1)(),
                        vValidator(testValidator2),
                        testValidator3,
                    ),
                })).build<number>(5);

                form.setValue(20);
                
                expect(factory).toHaveBeenCalledOnceWith([testValidator1, testValidator2, testValidator3]);
                expect(form.control.hasValidator(testValidator1)).toBeFalse();
                expect(form.control.hasValidator(testValidator2)).toBeFalse();
                expect(form.control.hasValidator(testValidator3)).toBeFalse();
                expect(form.control.hasValidator(testValidator4)).toBeTrue();
                expect(form.control.hasValidator(testValidator5)).toBeTrue();
            });

            it('should remove validators', () => {
                const factory = jasmine.createSpy().and.returnValue([testValidator4, testValidator5]);
                const compoundValidator = vCompoundValidator(factory);
                
                const form = vForm((n: number) => vControl({
                    validator: n < 10 ? compoundValidator(testValidator1) : undefined,
                })).build<number>(5);

                form.setValue(20);
                
                expect(form.control.hasValidator(testValidator1)).toBeFalse();
                expect(form.control.hasValidator(testValidator4)).toBeFalse();
                expect(form.control.hasValidator(testValidator5)).toBeFalse();
            });

            it('should do not recreate validators if child validation nodes were not modified', () => {
                const factory = jasmine.createSpy().and.returnValue([testValidator4, testValidator5]);
                const factory1 = () => testValidator1;
                const compoundValidator = vCompoundValidator(factory);
                
                const form = vForm((n: number) => vControl({
                    validator: n < 10
                        ? compoundValidator(
                            vValidatorFactory(factory1)(),
                            vValidator(testValidator2),
                            testValidator3,
                        )
                        : compoundValidator(
                            vValidatorFactory(factory1)(),
                            vValidator(testValidator2),
                            testValidator3,
                        ),
                })).build<number>(5);

                form.setValue(20);
                
                expect(factory).toHaveBeenCalledOnceWith([testValidator1, testValidator2, testValidator3]);
                expect(form.control.hasValidator(testValidator4)).toBeTrue();
                expect(form.control.hasValidator(testValidator5)).toBeTrue();
            });

            it('should do not recreate validators if child validation nodes were not modified (local args)', () => {
                const factory = jasmine.createSpy().and.returnValue([testValidator4, testValidator5]);
                const factory1 = () => testValidator1;
                const compoundValidator = vCompoundValidator(factory);
                
                const form = vForm((n: number) => vControl({
                    validator: n < 10
                        ? compoundValidator(
                            vValidatorFactory<V3>(factory1)(),
                            vValidator(testValidator2, ['abc']),
                        )
                        : compoundValidator(
                            vValidatorFactory<V3>(factory1)(),
                            vValidator(testValidator3, ['abc']),
                        ),
                })).build<number>(5);

                form.setValue(20);
                
                expect(factory).toHaveBeenCalledOnceWith([testValidator1, testValidator2]);
                expect(form.control.hasValidator(testValidator4)).toBeTrue();
                expect(form.control.hasValidator(testValidator5)).toBeTrue();
            });

            it('should recreate validators if at least on child validation node was modified', () => {
                const factory = jasmine.createSpy()
                    .and
                    .returnValue(testValidator4)
                    .and
                    .returnValue(testValidator5);
                const factory1 = () => testValidator1;
                const compoundValidator = vCompoundValidator(factory);
                
                const form = vForm((n: number) => vControl({
                    validator: compoundValidator(
                        vValidatorFactory<V3>(factory1)(),
                        n < 10 ? vValidator(testValidator2, ['abc']) : vValidator(testValidator3, ['def']),
                    ),
                })).build<number>(5);

                form.setValue(20);
                
                expect(factory).toHaveBeenCalledTimes(2);
                expect(form.control.hasValidator(testValidator4)).toBeFalse();
                expect(form.control.hasValidator(testValidator5)).toBeTrue();
            });

            it('should recreate validators if mixer function is different', () => {
                const factory1 = jasmine.createSpy().and.returnValue([testValidator1, testValidator2]);
                const factory2 = jasmine.createSpy().and.returnValue([testValidator3, testValidator4]);
                const compoundValidator1 = vCompoundValidator(factory1);
                const compoundValidator2 = vCompoundValidator(factory2);
                
                const form = vForm((n: number) => vControl({
                    validator: n < 10
                        ? compoundValidator1(testValidator5)
                        : compoundValidator2(testValidator5),
                })).build<number>(5);

                form.setValue(20);
                
                expect(factory1).toHaveBeenCalledOnceWith([testValidator5]);
                expect(factory2).toHaveBeenCalledOnceWith([testValidator5]);
                expect(form.control.hasValidator(testValidator1)).toBeFalse();
                expect(form.control.hasValidator(testValidator2)).toBeFalse();
                expect(form.control.hasValidator(testValidator3)).toBeTrue();
                expect(form.control.hasValidator(testValidator4)).toBeTrue();
            });

            it('should assign another validator if node type of validator was changed', () => {
                const factory = jasmine.createSpy().and.returnValue([testValidator1, testValidator2]);
                const compoundValidator = vCompoundValidator(factory);

                const form = vForm((n: number) => vControl({
                    validator: n < 10
                        ? compoundValidator(testValidator1)
                        : vValidator(testValidator3, [1, 'abc']),
                })).build<number>(5);

                form.setValue(20);

                expect(form.control.hasValidator(testValidator1)).toBeFalse();
                expect(form.control.hasValidator(testValidator2)).toBeFalse();
                expect(form.control.hasValidator(testValidator3)).toBeTrue();
            });
        });
    });

    describe('basic validators', () => {

    });
});
