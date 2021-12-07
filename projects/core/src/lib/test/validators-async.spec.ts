import { fakeAsync, tick } from '@angular/core/testing';
import { AbstractControl, AsyncValidatorFn, FormControl, Validators } from '@angular/forms';
import { WAsyncValidatorNode, wControl, wForm, WValidators } from '..';
import { WValidationStrategy } from '../reconcilation';
import { wCompoundValidatorAsync, wValidatorAsync, wValidatorFactoryAsync } from '../validators';
import { evenAsync, moreThan10Async } from './test-mocks';
import { toPromise } from './test-utils';

const TEST_VALUE = Object.freeze({});

const testValidator1 = makeAsyncValidator(1);
const testValidator2 = makeAsyncValidator(2);
const testValidator3 = makeAsyncValidator(3);
const testValidator4 = makeAsyncValidator(4);
const testValidator5 = makeAsyncValidator(5);

function trackAsyncValidators(control: AbstractControl) {
    const add = spyOn(control, 'addValidators');
    const remove = spyOn(control, 'removeValidators');
    const clear = spyOn(control, 'clearValidators');
    const set = spyOn(control, 'setAsyncValidators');

    return {
        expectNotChanged: () => {
            expect(add).not.toHaveBeenCalled();
            expect(remove).not.toHaveBeenCalled();
            expect(clear).not.toHaveBeenCalled();
            expect(set).not.toHaveBeenCalled();
        },
    };
}

function makeAsyncValidator(index: number): AsyncValidatorFn {
    return control => Promise.resolve(control.value === TEST_VALUE ? { [`__error_${index}__`]: true } : null);
}

async function hasControlAsyncValidator(control: AbstractControl, asyncValidator: AsyncValidatorFn): Promise<boolean> {
    if (!control.asyncValidator) {
        return false;
    }
    
    const temporaryControl = new FormControl(TEST_VALUE);
    const errorsToFind = await toPromise(asyncValidator(temporaryControl));
    const foundErrors = await toPromise(control.asyncValidator!(temporaryControl));

    const foundErrorsKeys = Object.keys(foundErrors || {});
    const errorsToFindKeys = Object.keys(errorsToFind || {});

    if (errorsToFindKeys.length === 0 || foundErrorsKeys.length === 0) {
        return false;
    }

    return errorsToFindKeys.every(key => foundErrorsKeys.includes(key));
}

function controlWithValidator(node: WAsyncValidatorNode): AbstractControl {
    const form = wForm((value) => wControl({ asyncValidator: node })).build(null);
    return form.control;
}

type V3 = (a: number, b: string, c: boolean) => AsyncValidatorFn;

describe('async validators', () => {
    describe('simple', () => {
        describe('first render', () => {
            it('should assign validator', async () => {
                const form = wForm((n: number) => wControl({
                    asyncValidator: wValidatorAsync(testValidator1),
                })).build(5);

                expect(await hasControlAsyncValidator(form.control, testValidator1)).toBeTrue();
            });
        });

        describe('reconcilation', () => {
            it('should assign validator', async () => {
                const form = wForm((n: number) => wControl({
                    asyncValidator: n < 10 ? undefined : wValidatorAsync(testValidator1),
                })).build<number>(5);

                form.setValue(20);

                expect(await hasControlAsyncValidator(form.control, testValidator1)).toBeTrue();
            });

            it('should remove validator', async () => {
                const form = wForm((n: number) => wControl({
                    asyncValidator: n < 10 ? wValidatorAsync(testValidator1) : undefined,
                })).build<number>(5);

                form.setValue(20);

                expect(await hasControlAsyncValidator(form.control, testValidator1)).toBeFalse();
            });

            it('should not change validator if validator function was not modified', async () => {
                const form = wForm((n: number) => wControl({
                    asyncValidator: wValidatorAsync(testValidator1),
                })).build<number>(5);

                const tracker = trackAsyncValidators(form.control);

                form.setValue(20);

                expect(await hasControlAsyncValidator(form.control, testValidator1)).toBeTrue();
                tracker.expectNotChanged();
            });

            it('should change validator if validator function was modified', async () => {
                const form = wForm((n: number) => wControl({
                    asyncValidator: n < 10 ? wValidatorAsync(testValidator1) : wValidatorAsync(testValidator2),
                })).build<number>(5);

                form.setValue(20);

                expect(await hasControlAsyncValidator(form.control, testValidator1)).toBeFalse();
                expect(await hasControlAsyncValidator(form.control, testValidator2)).toBeTrue();
            });

            it('should not change validator if locals are empty', async () => {
                const form = wForm((n: number) => wControl({
                    asyncValidator: n < 10 ? wValidatorAsync(testValidator1, []) : wValidatorAsync(testValidator2, []),
                })).build<number>(5);

                const tracker = trackAsyncValidators(form.control);

                form.setValue(20);

                expect(await hasControlAsyncValidator(form.control, testValidator1)).toBeTrue();
                tracker.expectNotChanged();
            });

            it('should not change validator if locals are the same', async () => {
                const form = wForm((n: number) => wControl({
                    asyncValidator: n < 10 ? wValidatorAsync(testValidator1, [1, 'abc']) : wValidatorAsync(testValidator2, [1, 'abc']),
                })).build<number>(5);

                const tracker = trackAsyncValidators(form.control);

                form.setValue(20);

                expect(await hasControlAsyncValidator(form.control, testValidator1)).toBeTrue();
                tracker.expectNotChanged();
            });

            it('should change validator if locals are different', async () => {
                const form = wForm((n: number) => wControl({
                    asyncValidator: n < 10 ? wValidatorAsync(testValidator1, [1, 'abc']) : wValidatorAsync(testValidator2, [2, 'abc']),
                })).build<number>(5);

                form.setValue(20);

                expect(await hasControlAsyncValidator(form.control, testValidator1)).toBeFalse();
                expect(await hasControlAsyncValidator(form.control, testValidator2)).toBeTrue();
            });

            it('should assign another validator if node type of validator was changed', async () => {
                const form = wForm((n: number) => wControl({
                    asyncValidator: n < 10
                        ? wValidatorAsync(testValidator1, [1, 'abc'])
                        : wValidatorFactoryAsync(() => testValidator2)(),
                })).build<number>(5);

                form.setValue(20);

                expect(await hasControlAsyncValidator(form.control, testValidator1)).toBeFalse();
                expect(await hasControlAsyncValidator(form.control, testValidator2)).toBeTrue();
            });
        });
    });

    describe('factory', () => {
        describe('first render', () => {
            it('should assign created validator', async () => {
                const form = wForm((n: number) => wControl({
                    asyncValidator: wValidatorFactoryAsync(() => testValidator1)(),
                })).build(5);

                expect(await hasControlAsyncValidator(form.control, testValidator1)).toBeTrue();
            });

            it('should create validator with specified arguments and assign it to control', async () => {
                const factory = jasmine.createSpy<V3>().and.returnValue(testValidator1);

                const form = wForm((n: number) => wControl({
                    asyncValidator: wValidatorFactoryAsync(factory)(1, 'abc', true),
                })).build(5);

                expect(await hasControlAsyncValidator(form.control, testValidator1)).toBeTrue();
                expect(factory).toHaveBeenCalledOnceWith(1, 'abc', true);
            });
        });

        describe('reconcilation', () => {
            it('should assign new validator by creating it with specified arguments', async () => {
                const factory = jasmine.createSpy<V3>().and.returnValues(testValidator1);

                const form = wForm((n: number) => wControl({
                    asyncValidator: n < 10 ? undefined : wValidatorFactoryAsync(factory)(1, 'abc', true),
                })).build<number>(5);

                form.setValue(20);

                expect(await hasControlAsyncValidator(form.control, testValidator1)).toBeTrue();
                expect(factory).toHaveBeenCalledOnceWith(1, 'abc', true);
            });

            it('should remove validator', async () => {
                const factory = jasmine.createSpy<V3>().and.returnValues(testValidator1);

                const form = wForm((n: number) => wControl({
                    asyncValidator: n < 10 ? wValidatorFactoryAsync(factory)(1, 'abc', true) : undefined,
                })).build<number>(5);

                form.setValue(20);

                expect(await hasControlAsyncValidator(form.control, testValidator1)).toBeFalse();
            });

            it('should not recreate validator if arguments are the same', async () => {
                const factory = jasmine.createSpy<V3>().and.returnValues(testValidator1);

                const form = wForm((n: number) => wControl({
                    asyncValidator: wValidatorFactoryAsync(factory)(1, 'abc', true),
                })).build<number>(5);

                const tracker = trackAsyncValidators(form.control);

                form.setValue(20);

                expect(await hasControlAsyncValidator(form.control, testValidator1)).toBeTrue();
                expect(factory).toHaveBeenCalledOnceWith(1, 'abc', true);
                tracker.expectNotChanged();
            });

            it('should recreate validator if arguments are different', async () => {
                const factory = jasmine.createSpy<V3>().and.returnValues(testValidator1, testValidator2);

                const form = wForm((n: number) => wControl({
                    asyncValidator: n < 10 ? wValidatorFactoryAsync(factory)(1, 'abc', true) : wValidatorFactoryAsync(factory)(1, 'abc', false),
                })).build<number>(5);

                form.setValue(20);

                expect(await hasControlAsyncValidator(form.control, testValidator2)).toBeTrue();
                expect(factory).toHaveBeenCalledWith(1, 'abc', false);
                expect(factory).toHaveBeenCalledTimes(2);
            });

            it('should recreate validator if factory function was modified', async () => {
                const factory1 = jasmine.createSpy<V3>().and.returnValues(testValidator1);
                const factory2 = jasmine.createSpy<V3>().and.returnValues(testValidator2);

                const form = wForm((n: number) => wControl({
                    asyncValidator: n < 10 ? wValidatorFactoryAsync(factory1)(1, 'abc', false) : wValidatorFactoryAsync(factory2)(1, 'abc', false),
                })).build<number>(5);

                form.setValue(20);

                expect(await hasControlAsyncValidator(form.control, testValidator2)).toBeTrue();
                expect(factory1).toHaveBeenCalledWith(1, 'abc', false);
                expect(factory2).toHaveBeenCalledWith(1, 'abc', false);
                expect(factory1).toHaveBeenCalledTimes(1);
                expect(factory2).toHaveBeenCalledTimes(1);
            });

            it('should assign another validator if node type of validator was changed', async () => {
                const form = wForm((n: number) => wControl({
                    asyncValidator: n < 10
                        ? wValidatorFactoryAsync(() => testValidator1)()
                        : wValidatorAsync(testValidator2, [1, 'abc']),
                })).build<number>(5);

                form.setValue(20);

                expect(await hasControlAsyncValidator(form.control, testValidator1)).toBeFalse();
                expect(await hasControlAsyncValidator(form.control, testValidator2)).toBeTrue();
            });
        });
    });

    describe('compound', () => {
        describe('first render', () => {
            it('should call mixer function with validators created by child validation nodes', async () => {
                const factory = jasmine.createSpy();
                const compoundValidator = wCompoundValidatorAsync(factory);
                
                wForm((n: number) => wControl({
                    asyncValidator: compoundValidator(
                        wValidatorFactoryAsync(() => testValidator1)(),
                        wValidatorAsync(testValidator2),
                        testValidator3,
                    ),
                })).build(5);
                
                expect(factory).toHaveBeenCalledOnceWith([testValidator1, testValidator2, testValidator3]);
            });

            it('should assign to control all retrieved validators', async () => {
                const factory = jasmine.createSpy().and.returnValue([testValidator4, testValidator5]);
                const compoundValidator = wCompoundValidatorAsync(factory);
                
                const form = wForm((n: number) => wControl({
                    asyncValidator: compoundValidator(testValidator1),
                })).build(5);

                expect(await hasControlAsyncValidator(form.control, testValidator1)).toBeFalse();
                expect(await hasControlAsyncValidator(form.control, testValidator4)).toBeTrue();
                expect(await hasControlAsyncValidator(form.control, testValidator5)).toBeTrue();
            });
        });

        describe('reconcilation', () => {
            it('should assign new validators by creating them from child validators', async () => {
                const factory = jasmine.createSpy().and.returnValue([testValidator4, testValidator5]);
                const compoundValidator = wCompoundValidatorAsync(factory);
                
                const form = wForm((n: number) => wControl({
                    asyncValidator: n < 10 ? undefined : compoundValidator(
                        wValidatorFactoryAsync(() => testValidator1)(),
                        wValidatorAsync(testValidator2),
                        testValidator3,
                    ),
                })).build<number>(5);

                form.setValue(20);
                
                expect(factory).toHaveBeenCalledOnceWith([testValidator1, testValidator2, testValidator3]);
                expect(await hasControlAsyncValidator(form.control, testValidator1)).toBeFalse();
                expect(await hasControlAsyncValidator(form.control, testValidator2)).toBeFalse();
                expect(await hasControlAsyncValidator(form.control, testValidator3)).toBeFalse();
                expect(await hasControlAsyncValidator(form.control, testValidator4)).toBeTrue();
                expect(await hasControlAsyncValidator(form.control, testValidator5)).toBeTrue();
            });

            it('should remove validators', async () => {
                const factory = jasmine.createSpy().and.returnValue([testValidator4, testValidator5]);
                const compoundValidator = wCompoundValidatorAsync(factory);
                
                const form = wForm((n: number) => wControl({
                    asyncValidator: n < 10 ? compoundValidator(testValidator1) : undefined,
                })).build<number>(5);

                form.setValue(20);
                
                expect(await hasControlAsyncValidator(form.control, testValidator1)).toBeFalse();
                expect(await hasControlAsyncValidator(form.control, testValidator4)).toBeFalse();
                expect(await hasControlAsyncValidator(form.control, testValidator5)).toBeFalse();
            });

            it('should do not recreate validators if child validation nodes were not modified', async () => {
                const factory = jasmine.createSpy().and.returnValue([testValidator4, testValidator5]);
                const factory1 = () => testValidator1;
                const compoundValidator = wCompoundValidatorAsync(factory);
                
                const form = wForm((n: number) => wControl({
                    asyncValidator: n < 10
                        ? compoundValidator(
                            wValidatorFactoryAsync(factory1)(),
                            wValidatorAsync(testValidator2),
                            testValidator3,
                        )
                        : compoundValidator(
                            wValidatorFactoryAsync(factory1)(),
                            wValidatorAsync(testValidator2),
                            testValidator3,
                        ),
                })).build<number>(5);

                form.setValue(20);
                
                expect(factory).toHaveBeenCalledOnceWith([testValidator1, testValidator2, testValidator3]);
                expect(await hasControlAsyncValidator(form.control, testValidator4)).toBeTrue();
                expect(await hasControlAsyncValidator(form.control, testValidator5)).toBeTrue();
            });

            it('should do not recreate validators if child validation nodes were not modified (local args)', async () => {
                const factory = jasmine.createSpy().and.returnValue([testValidator4, testValidator5]);
                const factory1 = () => testValidator1;
                const compoundValidator = wCompoundValidatorAsync(factory);
                
                const form = wForm((n: number) => wControl({
                    asyncValidator: n < 10
                        ? compoundValidator(
                            wValidatorFactoryAsync<V3>(factory1)(),
                            wValidatorAsync(testValidator2, ['abc']),
                        )
                        : compoundValidator(
                            wValidatorFactoryAsync<V3>(factory1)(),
                            wValidatorAsync(testValidator3, ['abc']),
                        ),
                })).build<number>(5);

                form.setValue(20);
                
                expect(factory).toHaveBeenCalledOnceWith([testValidator1, testValidator2]);
                expect(await hasControlAsyncValidator(form.control, testValidator4)).toBeTrue();
                expect(await hasControlAsyncValidator(form.control, testValidator5)).toBeTrue();
            });

            it('should recreate validators if at least on child validation node was modified', async () => {
                const factory = jasmine.createSpy()
                    .and
                    .returnValue(testValidator4)
                    .and
                    .returnValue(testValidator5);
                const factory1 = () => testValidator1;
                const compoundValidator = wCompoundValidatorAsync(factory);
                
                const form = wForm((n: number) => wControl({
                    asyncValidator: compoundValidator(
                        wValidatorFactoryAsync<V3>(factory1)(),
                        n < 10 ? wValidatorAsync(testValidator2, ['abc']) : wValidatorAsync(testValidator3, ['def']),
                    ),
                })).build<number>(5);

                form.setValue(20);
                
                expect(factory).toHaveBeenCalledTimes(2);
                expect(await hasControlAsyncValidator(form.control, testValidator4)).toBeFalse();
                expect(await hasControlAsyncValidator(form.control, testValidator5)).toBeTrue();
            });

            it('should recreate validators if mixer function is different', async () => {
                const factory1 = jasmine.createSpy().and.returnValue([testValidator1, testValidator2]);
                const factory2 = jasmine.createSpy().and.returnValue([testValidator3, testValidator4]);
                const compoundValidator1 = wCompoundValidatorAsync(factory1);
                const compoundValidator2 = wCompoundValidatorAsync(factory2);
                
                const form = wForm((n: number) => wControl({
                    asyncValidator: n < 10
                        ? compoundValidator1(testValidator5)
                        : compoundValidator2(testValidator5),
                })).build<number>(5);

                form.setValue(20);
                
                expect(factory1).toHaveBeenCalledOnceWith([testValidator5]);
                expect(factory2).toHaveBeenCalledOnceWith([testValidator5]);
                expect(await hasControlAsyncValidator(form.control, testValidator1)).toBeFalse();
                expect(await hasControlAsyncValidator(form.control, testValidator2)).toBeFalse();
                expect(await hasControlAsyncValidator(form.control, testValidator3)).toBeTrue();
                expect(await hasControlAsyncValidator(form.control, testValidator4)).toBeTrue();
            });

            it('should assign another validator if node type of validator was changed', async () => {
                const factory = jasmine.createSpy().and.returnValue([testValidator1, testValidator2]);
                const compoundValidator = wCompoundValidatorAsync(factory);

                const form = wForm((n: number) => wControl({
                    asyncValidator: n < 10
                        ? compoundValidator(testValidator1)
                        : wValidatorAsync(testValidator3, [1, 'abc']),
                })).build<number>(5);

                form.setValue(20);

                expect(await hasControlAsyncValidator(form.control, testValidator1)).toBeFalse();
                expect(await hasControlAsyncValidator(form.control, testValidator2)).toBeFalse();
                expect(await hasControlAsyncValidator(form.control, testValidator3)).toBeTrue();
            });
        });
    });

    describe('side effects', () => {
        describe(`${WValidationStrategy[WValidationStrategy.Append]} strategy`, () => {
            it('should restore removed validator', async () => {
                const form = wForm((n: number) => wControl({
                    asyncValidator: wValidatorAsync(testValidator1),
                })).build(5);
    
                form.control.setAsyncValidators(null);
    
                expect(await hasControlAsyncValidator(form.control, testValidator1)).toBeFalse();
    
                form.update();
    
                expect(await hasControlAsyncValidator(form.control, testValidator1)).toBeTrue();
            });
    
            it('should not remove other validators', async () => {
                const form = wForm((n: number) => wControl({
                    asyncValidator: wValidatorAsync(testValidator1),
                })).build(5);
    
                form.control.setAsyncValidators([form.control.asyncValidator!, testValidator2]);
    
                expect(await hasControlAsyncValidator(form.control, testValidator1)).toBeTrue();
                expect(await hasControlAsyncValidator(form.control, testValidator2)).toBeTrue();
                
                form.update();
                
                expect(await hasControlAsyncValidator(form.control, testValidator1)).toBeTrue();
                expect(await hasControlAsyncValidator(form.control, testValidator2)).toBeTrue();
            });
    
            it('should not remove other validators, if set of validators was modified', async () => {
                const form = wForm((n: number) => wControl({
                    asyncValidator: n < 10 ? wValidatorAsync(testValidator1) : wValidatorAsync(testValidator2),
                })).build<number>(5);
                
                form.control.setAsyncValidators([form.control.asyncValidator!, testValidator3]);
    
                expect(await hasControlAsyncValidator(form.control, testValidator1)).toBeTrue();
                expect(await hasControlAsyncValidator(form.control, testValidator2)).toBeFalse();
                expect(await hasControlAsyncValidator(form.control, testValidator3)).toBeTrue();
                
                form.setValue(20);
                
                expect(await hasControlAsyncValidator(form.control, testValidator1)).toBeFalse();
                expect(await hasControlAsyncValidator(form.control, testValidator2)).toBeTrue();
                expect(await hasControlAsyncValidator(form.control, testValidator3)).toBeTrue();
            });
    
            it('should update set of validators, even if initial validator was composed', async () => {
                const form = wForm((n: number) => wControl({
                    asyncValidator: n < 10 ? wValidatorAsync(testValidator1) : wValidatorAsync(testValidator2),
                })).build<number>(5);
                
                form.control.setAsyncValidators(Validators.composeAsync([form.control.asyncValidator!, testValidator3]));
    
                expect(await hasControlAsyncValidator(form.control, testValidator1)).toBeTrue();
                expect(await hasControlAsyncValidator(form.control, testValidator2)).toBeFalse();
                expect(await hasControlAsyncValidator(form.control, testValidator3)).toBeTrue();
                
                form.setValue(20);
                
                expect(await hasControlAsyncValidator(form.control, testValidator1)).toBeFalse();
                expect(await hasControlAsyncValidator(form.control, testValidator2)).toBeTrue();
                expect(await hasControlAsyncValidator(form.control, testValidator3)).toBeTrue();
            });
        });

        describe(`${WValidationStrategy[WValidationStrategy.Replace]} strategy`, () => {
            it('should restore removed validator', async () => {
                const form = wForm((n: number) => wControl({
                    asyncValidator: wValidatorAsync(testValidator1),
                })).validationStrategy(WValidationStrategy.Replace).build(5);
    
                form.control.setAsyncValidators(null);
    
                expect(await hasControlAsyncValidator(form.control, testValidator1)).toBeFalse();
    
                form.update();
    
                expect(await hasControlAsyncValidator(form.control, testValidator1)).toBeTrue();
            });
    
            it('should remove other validators', async () => {
                const form = wForm((n: number) => wControl({
                    asyncValidator: wValidatorAsync(testValidator1),
                })).validationStrategy(WValidationStrategy.Replace).build(5);
    
                form.control.setAsyncValidators([form.control.asyncValidator!, testValidator2]);
    
                expect(await hasControlAsyncValidator(form.control, testValidator1)).toBeTrue();
                expect(await hasControlAsyncValidator(form.control, testValidator2)).toBeTrue();
                
                form.update();
                
                expect(await hasControlAsyncValidator(form.control, testValidator1)).toBeTrue();
                expect(await hasControlAsyncValidator(form.control, testValidator2)).toBeFalse();
            });
    
            it('should remove other validators, if set of validators was modified', async () => {
                const form = wForm((n: number) => wControl({
                    asyncValidator: n < 10 ? wValidatorAsync(testValidator1) : wValidatorAsync(testValidator2),
                })).validationStrategy(WValidationStrategy.Replace).build<number>(5);
    
                form.control.setAsyncValidators([form.control.asyncValidator!, testValidator3]);
    
                expect(await hasControlAsyncValidator(form.control, testValidator1)).toBeTrue();
                expect(await hasControlAsyncValidator(form.control, testValidator2)).toBeFalse();
                expect(await hasControlAsyncValidator(form.control, testValidator3)).toBeTrue();
                
                form.setValue(20);
                
                expect(await hasControlAsyncValidator(form.control, testValidator1)).toBeFalse();
                expect(await hasControlAsyncValidator(form.control, testValidator2)).toBeTrue();
                expect(await hasControlAsyncValidator(form.control, testValidator3)).toBeFalse();
            });
    
            it('should replace set of validators, even if initial validator was composed', async () => {
                const form = wForm((n: number) => wControl({
                    asyncValidator: n < 10 ? wValidatorAsync(testValidator1) : wValidatorAsync(testValidator2),
                })).validationStrategy(WValidationStrategy.Replace).build<number>(5);
    
                form.control.setAsyncValidators(Validators.composeAsync([form.control.asyncValidator!, testValidator3]));
    
                expect(await hasControlAsyncValidator(form.control, testValidator1)).toBeTrue();
                expect(await hasControlAsyncValidator(form.control, testValidator2)).toBeFalse();
                expect(await hasControlAsyncValidator(form.control, testValidator3)).toBeTrue();
                
                form.setValue(20);
                
                expect(await hasControlAsyncValidator(form.control, testValidator1)).toBeFalse();
                expect(await hasControlAsyncValidator(form.control, testValidator2)).toBeTrue();
                expect(await hasControlAsyncValidator(form.control, testValidator3)).toBeFalse();
            });
        });
    });

    describe('instances', () => {
        describe('compose', () => {
            it('should not assign validator when there is no child validator', fakeAsync(() => {
                const no = controlWithValidator(WValidators.composeAsync());
                expect(no.asyncValidator).toBeFalsy();
            }));

            it('should return results of the single assigned validator', fakeAsync(() => {
                const single = controlWithValidator(WValidators.composeAsync(evenAsync));

                single.setValue(1);
                tick();
                expect(single.errors).toEqual({ even: true });

                single.setValue(2);
                tick();
                expect(single.errors).toBeFalsy();
            }));

            it('should successed if all validators are successed', fakeAsync(() => {
                const many = controlWithValidator(WValidators.composeAsync(evenAsync, moreThan10Async));

                many.setValue(100);
                tick();
                expect(many.errors).toBeFalsy();
            }));

            it('should fail and return merged results of all assigned validators, if at least one validator is failed', fakeAsync(() => {
                const many = controlWithValidator(WValidators.composeAsync(evenAsync, moreThan10Async));

                many.setValue(5);
                tick();
                expect(many.errors).toEqual({ even: true, min: true });

                many.setValue(4);
                tick();
                expect(many.errors).toEqual({ min: true });

                many.setValue(55);
                tick();
                expect(many.errors).toEqual({ even: true });
            }));
        });

        describe('and', () => {
            it('should not assign validator when there is no child validator', fakeAsync(() => {
                const no = controlWithValidator(WValidators.andAsync());
                tick();
                expect(no.asyncValidator).toBeFalsy();
            }));

            it('should return results of the single assigned validator', fakeAsync(() => {
                const single = controlWithValidator(WValidators.andAsync(evenAsync));

                single.setValue(1);
                tick();
                expect(single.errors).toEqual({ even: true });

                single.setValue(2);
                tick();
                expect(single.errors).toBeFalsy();
            }));

            it('should return results of the first failed validator', fakeAsync(() => {
                const many = controlWithValidator(WValidators.andAsync(evenAsync, moreThan10Async));

                many.setValue(5);
                tick();
                expect(many.errors).toEqual({ even: true });

                many.setValue(4);
                tick();
                expect(many.errors).toEqual({ min: true });

                many.setValue(55);
                tick();
                expect(many.errors).toEqual({ even: true });
            }));

            it('should successed if no any and validator is failed', fakeAsync(() => {
                const many = controlWithValidator(WValidators.andAsync(evenAsync, moreThan10Async));

                many.setValue(100);
                tick();
                expect(many.errors).toBeFalsy();
            }));
        });

        describe('or', () => {
            it('should not assign validator when there is no child validator', fakeAsync(() => {
                const no = controlWithValidator(WValidators.orAsync());
                tick();
                expect(no.asyncValidator).toBeFalsy();
            }));

            it('should return results of the single assigned validator', fakeAsync(() => {
                const single = controlWithValidator(WValidators.orAsync(evenAsync));

                single.setValue(1);
                tick();
                expect(single.errors).toEqual({ even: true });

                single.setValue(2);
                tick();
                expect(single.errors).toBeFalsy();
            }));

            it('should successed if at least one validator is successed', fakeAsync(() => {
                const many = controlWithValidator(WValidators.orAsync(evenAsync, moreThan10Async));

                many.setValue(4);
                tick();
                expect(many.errors).toBeFalsy();

                many.setValue(55);
                tick();
                expect(many.errors).toBeFalsy();

                many.setValue(100);
                tick();
                expect(many.errors).toBeFalsy();
            }));

            it('should fail and return merged results if all validators are failed', fakeAsync(() => {
                const many = controlWithValidator(WValidators.orAsync(evenAsync, moreThan10Async));

                many.setValue(5);
                tick();
                expect(many.errors).toEqual({ even: true, min: true });
            }));
        });
    });
});
