import { AbstractControl, FormControl, ValidatorFn, Validators } from '@angular/forms';
import { wControl } from '../basic';
import { wForm } from '../builder';
import { WValidatorNode } from '../model';
import { WValidationStrategy } from '../reconcilation';
import { wCompoundValidator, wValidator, wValidatorFactory, WValidators } from '../validators';
import { even, moreThan10 } from './test-mocks';

const TEST_VALUE = Object.freeze({});

const testValidator1 = makeValidator(1);
const testValidator2 = makeValidator(2);
const testValidator3 = makeValidator(3);
const testValidator4 = makeValidator(4);
const testValidator5 = makeValidator(5);

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

function makeValidator(index: number): ValidatorFn {
    return control => control.value === TEST_VALUE ? { [`__error_${index}__`]: true } : null;
}

function hasControlValidator(control: AbstractControl, validator: ValidatorFn): boolean {
    if (!control.validator) {
        return false;
    }
    
    const temporaryControl = new FormControl(TEST_VALUE);
    const errorsToFind = validator(temporaryControl);
    const foundErrors = control.validator(temporaryControl);

    const foundErrorsKeys = Object.keys(foundErrors || {});
    const errorsToFindKeys = Object.keys(errorsToFind || {});

    if (errorsToFindKeys.length === 0 || foundErrorsKeys.length === 0) {
        return false;
    }

    return errorsToFindKeys.every(key => foundErrorsKeys.includes(key));
}

function controlWithValidator(node: WValidatorNode): AbstractControl {
    const form = wForm(() => wControl({ validator: node })).build(null);
    return form.control;
}

type V3 = (a: number, b: string, c: boolean) => ValidatorFn;

describe('validators', () => {
    describe('simple', () => {
        describe('first render', () => {
            it('should assign validator', () => {
                const form = wForm((n: number) => wControl({
                    validator: wValidator(testValidator1),
                })).build(5);

                expect(hasControlValidator(form.control, testValidator1)).toBeTrue();
            });
        });

        describe('reconcilation', () => {
            it('should assign validator', () => {
                const form = wForm((n: number) => wControl({
                    validator: n < 10 ? undefined : wValidator(testValidator1),
                })).build<number>(5);

                form.setValue(20);

                expect(hasControlValidator(form.control, testValidator1)).toBeTrue();
            });

            it('should remove validator', () => {
                const form = wForm((n: number) => wControl({
                    validator: n < 10 ? wValidator(testValidator1) : undefined,
                })).build<number>(5);

                form.setValue(20);

                expect(hasControlValidator(form.control, testValidator1)).toBeFalse();
            });

            it('should not change validator if validator function was not modified', () => {
                const form = wForm((n: number) => wControl({
                    validator: wValidator(testValidator1),
                })).build<number>(5);

                const tracker = trackValidators(form.control);

                form.setValue(20);

                expect(hasControlValidator(form.control, testValidator1)).toBeTrue();
                tracker.expectNotChanged();
            });

            it('should change validator if validator function was modified', () => {
                const form = wForm((n: number) => wControl({
                    validator: n < 10 ? wValidator(testValidator1) : wValidator(testValidator2),
                })).build<number>(5);

                form.setValue(20);

                expect(hasControlValidator(form.control, testValidator1)).toBeFalse();
                expect(hasControlValidator(form.control, testValidator2)).toBeTrue();
            });

            it('should not change validator if locals are empty', () => {
                const form = wForm((n: number) => wControl({
                    validator: n < 10 ? wValidator(testValidator1, []) : wValidator(testValidator2, []),
                })).build<number>(5);

                const tracker = trackValidators(form.control);

                form.setValue(20);

                expect(hasControlValidator(form.control, testValidator1)).toBeTrue();
                tracker.expectNotChanged();
            });

            it('should not change validator if locals are the same', () => {
                const form = wForm((n: number) => wControl({
                    validator: n < 10 ? wValidator(testValidator1, [1, 'abc']) : wValidator(testValidator2, [1, 'abc']),
                })).build<number>(5);

                const tracker = trackValidators(form.control);

                form.setValue(20);

                expect(hasControlValidator(form.control, testValidator1)).toBeTrue();
                tracker.expectNotChanged();
            });

            it('should change validator if locals are different', () => {
                const form = wForm((n: number) => wControl({
                    validator: n < 10 ? wValidator(testValidator1, [1, 'abc']) : wValidator(testValidator2, [2, 'abc']),
                })).build<number>(5);

                form.setValue(20);

                expect(hasControlValidator(form.control, testValidator1)).toBeFalse();
                expect(hasControlValidator(form.control, testValidator2)).toBeTrue();
            });

            it('should assign another validator if node type of validator was changed', () => {
                const form = wForm((n: number) => wControl({
                    validator: n < 10
                        ? wValidator(testValidator1, [1, 'abc'])
                        : wValidatorFactory(() => testValidator2)(),
                })).build<number>(5);

                form.setValue(20);

                expect(hasControlValidator(form.control, testValidator1)).toBeFalse();
                expect(hasControlValidator(form.control, testValidator2)).toBeTrue();
            });
        });
    });

    describe('factory', () => {
        describe('first render', () => {
            it('should assign created validator', () => {
                const form = wForm((n: number) => wControl({
                    validator: wValidatorFactory(() => testValidator1)(),
                })).build(5);

                expect(hasControlValidator(form.control, testValidator1)).toBeTrue();
            });

            it('should create validator with specified arguments and assign it to control', () => {
                const factory = jasmine.createSpy<V3>().and.returnValue(testValidator1);

                const form = wForm((n: number) => wControl({
                    validator: wValidatorFactory(factory)(1, 'abc', true),
                })).build(5);

                expect(hasControlValidator(form.control, testValidator1)).toBeTrue();
                expect(factory).toHaveBeenCalledOnceWith(1, 'abc', true);
            });
        });

        describe('reconcilation', () => {
            it('should assign new validator by creating it with specified arguments', () => {
                const factory = jasmine.createSpy<V3>().and.returnValues(testValidator1);

                const form = wForm((n: number) => wControl({
                    validator: n < 10 ? undefined : wValidatorFactory(factory)(1, 'abc', true),
                })).build<number>(5);

                form.setValue(20);

                expect(hasControlValidator(form.control, testValidator1)).toBeTrue();
                expect(factory).toHaveBeenCalledOnceWith(1, 'abc', true);
            });

            it('should remove validator', () => {
                const factory = jasmine.createSpy<V3>().and.returnValues(testValidator1);

                const form = wForm((n: number) => wControl({
                    validator: n < 10 ? wValidatorFactory(factory)(1, 'abc', true) : undefined,
                })).build<number>(5);

                form.setValue(20);

                expect(hasControlValidator(form.control, testValidator1)).toBeFalse();
            });

            it('should not recreate validator if arguments are the same', () => {
                const factory = jasmine.createSpy<V3>().and.returnValues(testValidator1);

                const form = wForm((n: number) => wControl({
                    validator: wValidatorFactory(factory)(1, 'abc', true),
                })).build<number>(5);

                const tracker = trackValidators(form.control);

                form.setValue(20);

                expect(hasControlValidator(form.control, testValidator1)).toBeTrue();
                expect(factory).toHaveBeenCalledOnceWith(1, 'abc', true);
                tracker.expectNotChanged();
            });

            it('should recreate validator if arguments are different', () => {
                const factory = jasmine.createSpy<V3>().and.returnValues(testValidator1, testValidator2);

                const form = wForm((n: number) => wControl({
                    validator: n < 10 ? wValidatorFactory(factory)(1, 'abc', true) : wValidatorFactory(factory)(1, 'abc', false),
                })).build<number>(5);

                form.setValue(20);

                expect(hasControlValidator(form.control, testValidator2)).toBeTrue();
                expect(factory).toHaveBeenCalledWith(1, 'abc', false);
                expect(factory).toHaveBeenCalledTimes(2);
            });

            it('should recreate validator if factory function was modified', () => {
                const factory1 = jasmine.createSpy<V3>().and.returnValues(testValidator1);
                const factory2 = jasmine.createSpy<V3>().and.returnValues(testValidator2);

                const form = wForm((n: number) => wControl({
                    validator: n < 10 ? wValidatorFactory(factory1)(1, 'abc', false) : wValidatorFactory(factory2)(1, 'abc', false),
                })).build<number>(5);

                form.setValue(20);

                expect(hasControlValidator(form.control, testValidator2)).toBeTrue();
                expect(factory1).toHaveBeenCalledWith(1, 'abc', false);
                expect(factory2).toHaveBeenCalledWith(1, 'abc', false);
                expect(factory1).toHaveBeenCalledTimes(1);
                expect(factory2).toHaveBeenCalledTimes(1);
            });

            it('should assign another validator if node type of validator was changed', () => {
                const form = wForm((n: number) => wControl({
                    validator: n < 10
                        ? wValidatorFactory(() => testValidator1)()
                        : wValidator(testValidator2, [1, 'abc']),
                })).build<number>(5);

                form.setValue(20);

                expect(hasControlValidator(form.control, testValidator1)).toBeFalse();
                expect(hasControlValidator(form.control, testValidator2)).toBeTrue();
            });
        });
    });

    describe('compound', () => {
        describe('first render', () => {
            it('should call mixer function with validators created by child validation nodes', () => {
                const factory = jasmine.createSpy();
                const compoundValidator = wCompoundValidator(factory);
                
                wForm((n: number) => wControl({
                    validator: compoundValidator(
                        wValidatorFactory(() => testValidator1)(),
                        wValidator(testValidator2),
                        testValidator3,
                    ),
                })).build(5);
                
                expect(factory).toHaveBeenCalledOnceWith([testValidator1, testValidator2, testValidator3]);
            });

            it('should assign to control all retrieved validators', () => {
                const factory = jasmine.createSpy().and.returnValue([testValidator4, testValidator5]);
                const compoundValidator = wCompoundValidator(factory);
                
                const form = wForm((n: number) => wControl({
                    validator: compoundValidator(testValidator1),
                })).build(5);

                expect(hasControlValidator(form.control, testValidator1)).toBeFalse();
                expect(hasControlValidator(form.control, testValidator4)).toBeTrue();
                expect(hasControlValidator(form.control, testValidator5)).toBeTrue();
            });
        });

        describe('reconcilation', () => {
            it('should assign new validators by creating them from child validators', () => {
                const factory = jasmine.createSpy().and.returnValue([testValidator4, testValidator5]);
                const compoundValidator = wCompoundValidator(factory);
                
                const form = wForm((n: number) => wControl({
                    validator: n < 10 ? undefined : compoundValidator(
                        wValidatorFactory(() => testValidator1)(),
                        wValidator(testValidator2),
                        testValidator3,
                    ),
                })).build<number>(5);

                form.setValue(20);
                
                expect(factory).toHaveBeenCalledOnceWith([testValidator1, testValidator2, testValidator3]);
                expect(hasControlValidator(form.control, testValidator1)).toBeFalse();
                expect(hasControlValidator(form.control, testValidator2)).toBeFalse();
                expect(hasControlValidator(form.control, testValidator3)).toBeFalse();
                expect(hasControlValidator(form.control, testValidator4)).toBeTrue();
                expect(hasControlValidator(form.control, testValidator5)).toBeTrue();
            });

            it('should remove validators', () => {
                const factory = jasmine.createSpy().and.returnValue([testValidator4, testValidator5]);
                const compoundValidator = wCompoundValidator(factory);
                
                const form = wForm((n: number) => wControl({
                    validator: n < 10 ? compoundValidator(testValidator1) : undefined,
                })).build<number>(5);

                form.setValue(20);
                
                expect(hasControlValidator(form.control, testValidator1)).toBeFalse();
                expect(hasControlValidator(form.control, testValidator4)).toBeFalse();
                expect(hasControlValidator(form.control, testValidator5)).toBeFalse();
            });

            it('should do not recreate validators if child validation nodes were not modified', () => {
                const factory = jasmine.createSpy().and.returnValue([testValidator4, testValidator5]);
                const factory1 = () => testValidator1;
                const compoundValidator = wCompoundValidator(factory);
                
                const form = wForm((n: number) => wControl({
                    validator: n < 10
                        ? compoundValidator(
                            wValidatorFactory(factory1)(),
                            wValidator(testValidator2),
                            testValidator3,
                        )
                        : compoundValidator(
                            wValidatorFactory(factory1)(),
                            wValidator(testValidator2),
                            testValidator3,
                        ),
                })).build<number>(5);

                form.setValue(20);
                
                expect(factory).toHaveBeenCalledOnceWith([testValidator1, testValidator2, testValidator3]);
                expect(hasControlValidator(form.control, testValidator4)).toBeTrue();
                expect(hasControlValidator(form.control, testValidator5)).toBeTrue();
            });

            it('should do not recreate validators if child validation nodes were not modified (local args)', () => {
                const factory = jasmine.createSpy().and.returnValue([testValidator4, testValidator5]);
                const factory1 = () => testValidator1;
                const compoundValidator = wCompoundValidator(factory);
                
                const form = wForm((n: number) => wControl({
                    validator: n < 10
                        ? compoundValidator(
                            wValidatorFactory<V3>(factory1)(),
                            wValidator(testValidator2, ['abc']),
                        )
                        : compoundValidator(
                            wValidatorFactory<V3>(factory1)(),
                            wValidator(testValidator3, ['abc']),
                        ),
                })).build<number>(5);

                form.setValue(20);
                
                expect(factory).toHaveBeenCalledOnceWith([testValidator1, testValidator2]);
                expect(hasControlValidator(form.control, testValidator4)).toBeTrue();
                expect(hasControlValidator(form.control, testValidator5)).toBeTrue();
            });

            it('should recreate validators if at least on child validation node was modified', () => {
                const factory = jasmine.createSpy()
                    .and
                    .returnValue(testValidator4)
                    .and
                    .returnValue(testValidator5);
                const factory1 = () => testValidator1;
                const compoundValidator = wCompoundValidator(factory);
                
                const form = wForm((n: number) => wControl({
                    validator: compoundValidator(
                        wValidatorFactory<V3>(factory1)(),
                        n < 10 ? wValidator(testValidator2, ['abc']) : wValidator(testValidator3, ['def']),
                    ),
                })).build<number>(5);

                form.setValue(20);
                
                expect(factory).toHaveBeenCalledTimes(2);
                expect(hasControlValidator(form.control, testValidator4)).toBeFalse();
                expect(hasControlValidator(form.control, testValidator5)).toBeTrue();
            });

            it('should recreate validators if mixer function is different', () => {
                const factory1 = jasmine.createSpy().and.returnValue([testValidator1, testValidator2]);
                const factory2 = jasmine.createSpy().and.returnValue([testValidator3, testValidator4]);
                const compoundValidator1 = wCompoundValidator(factory1);
                const compoundValidator2 = wCompoundValidator(factory2);
                
                const form = wForm((n: number) => wControl({
                    validator: n < 10
                        ? compoundValidator1(testValidator5)
                        : compoundValidator2(testValidator5),
                })).build<number>(5);

                form.setValue(20);
                
                expect(factory1).toHaveBeenCalledOnceWith([testValidator5]);
                expect(factory2).toHaveBeenCalledOnceWith([testValidator5]);
                expect(hasControlValidator(form.control, testValidator1)).toBeFalse();
                expect(hasControlValidator(form.control, testValidator2)).toBeFalse();
                expect(hasControlValidator(form.control, testValidator3)).toBeTrue();
                expect(hasControlValidator(form.control, testValidator4)).toBeTrue();
            });

            it('should assign another validator if node type of validator was changed', () => {
                const factory = jasmine.createSpy().and.returnValue([testValidator1, testValidator2]);
                const compoundValidator = wCompoundValidator(factory);

                const form = wForm((n: number) => wControl({
                    validator: n < 10
                        ? compoundValidator(testValidator1)
                        : wValidator(testValidator3, [1, 'abc']),
                })).build<number>(5);

                form.setValue(20);

                expect(hasControlValidator(form.control, testValidator1)).toBeFalse();
                expect(hasControlValidator(form.control, testValidator2)).toBeFalse();
                expect(hasControlValidator(form.control, testValidator3)).toBeTrue();
            });
        });
    });

    describe('side effects', () => {
        describe(`${WValidationStrategy[WValidationStrategy.Append]} strategy`, () => {
            it('should restore removed validator', () => {
                const form = wForm((n: number) => wControl({
                    validator: wValidator(testValidator1),
                })).build(5);
    
                form.control.setValidators(null);
    
                expect(hasControlValidator(form.control, testValidator1)).toBeFalse();
    
                form.update();
    
                expect(hasControlValidator(form.control, testValidator1)).toBeTrue();
            });
    
            it('should not remove other validators', () => {
                const form = wForm((n: number) => wControl({
                    validator: wValidator(testValidator1),
                })).build(5);
    
                form.control.setValidators([form.control.validator!, testValidator2]);
    
                expect(hasControlValidator(form.control, testValidator1)).toBeTrue();
                expect(hasControlValidator(form.control, testValidator2)).toBeTrue();
                
                form.update();
                
                expect(hasControlValidator(form.control, testValidator1)).toBeTrue();
                expect(hasControlValidator(form.control, testValidator2)).toBeTrue();
            });
    
            it('should not remove other validators, if set of validators was modified', () => {
                const form = wForm((n: number) => wControl({
                    validator: n < 10 ? wValidator(testValidator1) : wValidator(testValidator2),
                })).build<number>(5);
                
                form.control.setValidators([form.control.validator!, testValidator3]);
    
                expect(hasControlValidator(form.control, testValidator1)).toBeTrue();
                expect(hasControlValidator(form.control, testValidator2)).toBeFalse();
                expect(hasControlValidator(form.control, testValidator3)).toBeTrue();
                
                form.setValue(20);
                
                expect(hasControlValidator(form.control, testValidator1)).toBeFalse();
                expect(hasControlValidator(form.control, testValidator2)).toBeTrue();
                expect(hasControlValidator(form.control, testValidator3)).toBeTrue();
            });
    
            it('should update set of validators, even if initial validator was composed', () => {
                const form = wForm((n: number) => wControl({
                    validator: n < 10 ? wValidator(testValidator1) : wValidator(testValidator2),
                })).build<number>(5);
                
                form.control.setValidators(Validators.compose([form.control.validator!, testValidator3]));
    
                expect(hasControlValidator(form.control, testValidator1)).toBeTrue();
                expect(hasControlValidator(form.control, testValidator2)).toBeFalse();
                expect(hasControlValidator(form.control, testValidator3)).toBeTrue();
                
                form.setValue(20);
                
                expect(hasControlValidator(form.control, testValidator1)).toBeFalse();
                expect(hasControlValidator(form.control, testValidator2)).toBeTrue();
                expect(hasControlValidator(form.control, testValidator3)).toBeTrue();
            });
        });

        describe(`${WValidationStrategy[WValidationStrategy.Replace]} strategy`, () => {
            it('should restore removed validator', () => {
                const form = wForm((n: number) => wControl({
                    validator: wValidator(testValidator1),
                })).validationStrategy(WValidationStrategy.Replace).build(5);
    
                form.control.setValidators(null);
    
                expect(hasControlValidator(form.control, testValidator1)).toBeFalse();
    
                form.update();
    
                expect(hasControlValidator(form.control, testValidator1)).toBeTrue();
            });
    
            it('should remove other validators', () => {
                const form = wForm((n: number) => wControl({
                    validator: wValidator(testValidator1),
                })).validationStrategy(WValidationStrategy.Replace).build(5);
    
                form.control.setValidators([form.control.validator!, testValidator2]);
    
                expect(hasControlValidator(form.control, testValidator1)).toBeTrue();
                expect(hasControlValidator(form.control, testValidator2)).toBeTrue();
                
                form.update();
                
                expect(hasControlValidator(form.control, testValidator1)).toBeTrue();
                expect(hasControlValidator(form.control, testValidator2)).toBeFalse();
            });
    
            it('should remove other validators, if set of validators was modified', () => {
                const form = wForm((n: number) => wControl({
                    validator: n < 10 ? wValidator(testValidator1) : wValidator(testValidator2),
                })).validationStrategy(WValidationStrategy.Replace).build<number>(5);
    
                form.control.setValidators([form.control.validator!, testValidator3]);
    
                expect(hasControlValidator(form.control, testValidator1)).toBeTrue();
                expect(hasControlValidator(form.control, testValidator2)).toBeFalse();
                expect(hasControlValidator(form.control, testValidator3)).toBeTrue();
                
                form.setValue(20);
                
                expect(hasControlValidator(form.control, testValidator1)).toBeFalse();
                expect(hasControlValidator(form.control, testValidator2)).toBeTrue();
                expect(hasControlValidator(form.control, testValidator3)).toBeFalse();
            });
    
            it('should replace set of validators, even if initial validator was composed', () => {
                const form = wForm((n: number) => wControl({
                    validator: n < 10 ? wValidator(testValidator1) : wValidator(testValidator2),
                })).validationStrategy(WValidationStrategy.Replace).build<number>(5);
    
                form.control.setValidators(Validators.compose([form.control.validator!, testValidator3]));
    
                expect(hasControlValidator(form.control, testValidator1)).toBeTrue();
                expect(hasControlValidator(form.control, testValidator2)).toBeFalse();
                expect(hasControlValidator(form.control, testValidator3)).toBeTrue();
                
                form.setValue(20);
                
                expect(hasControlValidator(form.control, testValidator1)).toBeFalse();
                expect(hasControlValidator(form.control, testValidator2)).toBeTrue();
                expect(hasControlValidator(form.control, testValidator3)).toBeFalse();
            });
        });
    });

    describe('instances', () => {
        describe('compose', () => {
            it('should not assign validator when there is no child validator', () => {
                const no = controlWithValidator(WValidators.compose());
                expect(no.validator).toBeFalsy();
            });

            it('should return results of the single assigned validator', () => {
                const single = controlWithValidator(WValidators.compose(even));

                single.setValue(1);
                expect(single.errors).toEqual({ even: true });

                single.setValue(2);
                expect(single.errors).toBeFalsy();
            });

            it('should successed if all validators are successed', () => {
                const many = controlWithValidator(WValidators.compose(even, moreThan10));

                many.setValue(100);
                expect(many.errors).toBeFalsy();
            });

            it('should fail and return merged results of all assigned validators, if at least one validator is failed', () => {
                const many = controlWithValidator(WValidators.compose(even, moreThan10));

                many.setValue(5);
                expect(many.errors).toEqual({ even: true, min: true });

                many.setValue(4);
                expect(many.errors).toEqual({ min: true });

                many.setValue(55);
                expect(many.errors).toEqual({ even: true });
            });
        });

        describe('and', () => {
            it('should not assign validator when there is no child validator', () => {
                const no = controlWithValidator(WValidators.and());
                expect(no.validator).toBeFalsy();
            });

            it('should return results of the single assigned validator', () => {
                const single = controlWithValidator(WValidators.and(even));

                single.setValue(1);
                expect(single.errors).toEqual({ even: true });

                single.setValue(2);
                expect(single.errors).toBeFalsy();
            });

            it('should return results of the first failed validator', () => {
                const many = controlWithValidator(WValidators.and(even, moreThan10));

                many.setValue(5);
                expect(many.errors).toEqual({ even: true });

                many.setValue(4);
                expect(many.errors).toEqual({ min: true });

                many.setValue(55);
                expect(many.errors).toEqual({ even: true });

            });

            it('should successed if no any and validator is failed', () => {
                const many = controlWithValidator(WValidators.and(even, moreThan10));

                many.setValue(100);
                expect(many.errors).toBeFalsy();
            });
        });

        describe('or', () => {
            it('should not assign validator when there is no child validator', () => {
                const no = controlWithValidator(WValidators.or());
                expect(no.validator).toBeFalsy();
            });

            it('should return results of the single assigned validator', () => {
                const single = controlWithValidator(WValidators.or(even));

                single.setValue(1);
                expect(single.errors).toEqual({ even: true });

                single.setValue(2);
                expect(single.errors).toBeFalsy();
            });

            it('should successed if at least one validator is successed', () => {
                const many = controlWithValidator(WValidators.or(even, moreThan10));

                many.setValue(4);
                expect(many.errors).toBeFalsy();

                many.setValue(55);
                expect(many.errors).toBeFalsy();

                many.setValue(100);
                expect(many.errors).toBeFalsy();
            });

            it('should fail and return merged results if all validators are failed', () => {
                const many = controlWithValidator(WValidators.or(even, moreThan10));

                many.setValue(5);
                expect(many.errors).toEqual({ even: true, min: true });
            });
        });
    });
});
