import { AbstractControl, AsyncValidatorFn } from '@angular/forms';
import { VValidationStrategy } from '.';
import { VAsyncValidatorNode, VAsyncValidatorNodeType } from '..';
import { arrayDiffUnordered, arrayify, flatMap } from '../utils';
import { canAccessListOfValidators, canManageValidatorsIndividually } from './flags';
import { AsyncValidatorBundle, createAsyncValidatorBundle } from './internal-model';
import { getLastAsyncValidatorBundle, getLastFormNodeOrNothing } from './registry';
import { VRenderContext } from './render-context';

interface Control12AsyncValidatorsApi {
    hasAsyncValidator(validator: AsyncValidatorFn): boolean;
    addAsyncValidators(validator: AsyncValidatorFn): void;
    removeAsyncValidators(validator: AsyncValidatorFn): void;
}

export function processAsyncValidators(ctx: VRenderContext, node?: VAsyncValidatorNode, control?: AbstractControl): AsyncValidatorBundle {
    if (!control) {
        return createAsyncValidatorBundle(createValidators(node));
    }

    const lastNode = getLastFormNodeOrNothing(control)?.asyncValidator;
    const lastValidatorBundle = getLastAsyncValidatorBundle(control);

    return applyValidators(
        ctx,
        ctx.options.validationStrategy,
        control,
        lastValidatorBundle,
        areValidatorsChanged(lastNode, node) ? createValidators(node) : lastValidatorBundle.children,
    );
}

function applyValidators(ctx: VRenderContext,
                         strategy: VValidationStrategy,
                         control: AbstractControl,
                         lastValidatorBundle: AsyncValidatorBundle,
                         nextValidators: AsyncValidatorFn[]): AsyncValidatorBundle {
    switch (strategy) {
        case VValidationStrategy.Append:
            if (canManageValidatorsIndividually) {
                return appendValidatorsIndividually(ctx, control as Control12AsyncValidatorsApi, lastValidatorBundle, nextValidators);
            } else if (canAccessListOfValidators) {
                return appendValidatorsInBulk(ctx, control, lastValidatorBundle, nextValidators);
            } else {
                return appendValidatorsByComposing(ctx, control, lastValidatorBundle, nextValidators);
            }
        case VValidationStrategy.Replace:
            return replaceValidators(ctx, control, lastValidatorBundle, nextValidators);
        default:
            throw new Error(`Unsupported validation strategy: '${VValidationStrategy[strategy]}'`);
    }
}

function appendValidatorsIndividually(ctx: VRenderContext, control: Control12AsyncValidatorsApi, lastValidatorBundle: AsyncValidatorBundle, nextValidators: AsyncValidatorFn[]): AsyncValidatorBundle {
    const { added, removed, common } = arrayDiffUnordered(lastValidatorBundle.children, nextValidators);

    const hasCompiledValidator = lastValidatorBundle.compiled && control.hasAsyncValidator(lastValidatorBundle.compiled);
    const hasValidators = added.length > 0 || common.length > 0;
    const areValidatorsModified = added.length > 0 || removed.length > 0;

    if (lastValidatorBundle.compiled && !hasCompiledValidator) {
        ctx.markValidatorsChanged();
        lastValidatorBundle.compiled.dispose();
    }

    if (hasValidators) {
        if (!hasCompiledValidator) {
            ctx.markValidatorsChanged();
            const bundle = createAsyncValidatorBundle(added.concat(common));
            control.addAsyncValidators(bundle.compiled!);
            return bundle;
        } else if (areValidatorsModified) {
            ctx.markValidatorsChanged();
            return modifyValidatorBundle(lastValidatorBundle, added.concat(common));
        }
    } else if (hasCompiledValidator) {
        ctx.markValidatorsChanged();
        lastValidatorBundle.compiled!.dispose();
        control.removeAsyncValidators(lastValidatorBundle.compiled!);
        return createAsyncValidatorBundle([]);
    }

    return lastValidatorBundle;
}

function appendValidatorsInBulk(ctx: VRenderContext, control: AbstractControl, lastValidatorBundle: AsyncValidatorBundle, nextValidators: AsyncValidatorFn[]): AsyncValidatorBundle {
    const { added, removed, common } = arrayDiffUnordered(lastValidatorBundle.children, nextValidators);

    const validators = getControlAsyncValidators(control);
    const hasCompiledValidator = lastValidatorBundle.compiled && validators.includes(lastValidatorBundle.compiled);
    const hasValidators = added.length > 0 || common.length > 0;
    const areValidatorsModified = added.length > 0 || removed.length > 0;

    if (lastValidatorBundle.compiled && !hasCompiledValidator) {
        ctx.markValidatorsChanged();
        lastValidatorBundle.compiled.dispose();
    }

    if (hasValidators) {
        if (!hasCompiledValidator) {
            ctx.markValidatorsChanged();
            const bundle = createAsyncValidatorBundle(added.concat(common));
            control.setAsyncValidators([...validators, bundle.compiled!]);
            return bundle;
        } else if (areValidatorsModified) {
            ctx.markValidatorsChanged();
            return modifyValidatorBundle(lastValidatorBundle, added.concat(common));
        }
    } else if (hasCompiledValidator) {
        ctx.markValidatorsChanged();
        lastValidatorBundle.compiled!.dispose();
        control.setAsyncValidators(validators.filter(v => v !== lastValidatorBundle.compiled));
        return createAsyncValidatorBundle([]);
    }

    return lastValidatorBundle;
}

function appendValidatorsByComposing(ctx: VRenderContext, control: AbstractControl, lastValidatorBundle: AsyncValidatorBundle, nextValidators: AsyncValidatorFn[]): AsyncValidatorBundle {
    const { added, removed, common } = arrayDiffUnordered(lastValidatorBundle.children, nextValidators);

    const hasCompiledValidator = lastValidatorBundle.compiled && lastValidatorBundle.compiled === control.validator;
    const hasValidators = added.length > 0 || common.length > 0;
    const areValidatorsModified = added.length > 0 || removed.length > 0;

    if (lastValidatorBundle.compiled && !hasCompiledValidator) {
        ctx.markValidatorsChanged();
        lastValidatorBundle.compiled.dispose();
    }

    if (hasValidators) {
        if (!hasCompiledValidator) {
            ctx.markValidatorsChanged();
            const bundle = createAsyncValidatorBundle(added.concat(common).concat(arrayify(control.asyncValidator)));
            control.asyncValidator = bundle.compiled || null;
            return bundle;
        } else if (areValidatorsModified) {
            ctx.markValidatorsChanged();
            return modifyValidatorBundle(lastValidatorBundle, added.concat(common));
        }
    } else if (hasCompiledValidator) {
        ctx.markValidatorsChanged();
        lastValidatorBundle.compiled!.dispose();
        control.asyncValidator = null;
        return createAsyncValidatorBundle([]);
    }

    return lastValidatorBundle;
}

function replaceValidators(ctx: VRenderContext, control: AbstractControl, lastValidatorBundle: AsyncValidatorBundle, nextValidators: AsyncValidatorFn[]): AsyncValidatorBundle {
    const { added, removed, common } = arrayDiffUnordered(lastValidatorBundle.children, nextValidators);

    const hasCompiledValidator = lastValidatorBundle.compiled && lastValidatorBundle.compiled === control.validator;
    const hasValidators = added.length > 0 || common.length > 0;
    const areValidatorsModified = added.length > 0 || removed.length > 0;

    if (lastValidatorBundle.compiled && !hasCompiledValidator) {
        ctx.markValidatorsChanged();
        lastValidatorBundle.compiled.dispose();
    }

    if (hasValidators) {
        if (!hasCompiledValidator) {
            ctx.markValidatorsChanged();
            const bundle = createAsyncValidatorBundle(added.concat(common));
            control.asyncValidator = bundle.compiled || null;
            return bundle;
        } else if (areValidatorsModified) {
            ctx.markValidatorsChanged();
            lastValidatorBundle.compiled!.setAsyncValidators(added.concat(common));
            return lastValidatorBundle;
        }
    } else {
        if (hasCompiledValidator) {
            ctx.markValidatorsChanged();
            lastValidatorBundle.compiled!.dispose();
        }
        if (control.asyncValidator) {
            ctx.markValidatorsChanged();
            control.asyncValidator = null;
        }
        return createAsyncValidatorBundle([]);
    }

    return lastValidatorBundle;
}

function modifyValidatorBundle(bundle: AsyncValidatorBundle, validators: AsyncValidatorFn[]): AsyncValidatorBundle {
    if (!bundle.compiled) {
        return createAsyncValidatorBundle(validators);
    }

    bundle.compiled.setAsyncValidators(validators);
    return bundle;
}

function getControlAsyncValidators(control: AbstractControl): AsyncValidatorFn[] {
    return arrayify((control as any)._rawAsyncValidators);
}

function areValidatorsChanged(a?: VAsyncValidatorNode, b?: VAsyncValidatorNode): boolean {
    if ((a == null) !== (b == null)) {
        return true;
    }

    if (a == null || b == null) {
        return false;
    }

    return !isValidatorEqual(a, b);
}

function isValidatorEqual(a: VAsyncValidatorNode, b: VAsyncValidatorNode): boolean {
    if (a.type === VAsyncValidatorNodeType.Simple && b.type === VAsyncValidatorNodeType.Simple) {
        if (a.validator === b.validator) {
            return true;
        }

        if ((a.locals == null) !== (b.locals == null)
            || a.locals == null || b.locals == null
            || a.locals.length !== b.locals.length) {
            return false;
        }

        return a.locals.every((l, i) => l === b.locals![i]);
    }

    if (a.type === VAsyncValidatorNodeType.Factory && b.type === VAsyncValidatorNodeType.Factory) {
        if (a.factory !== b.factory || a.args.length !== b.args.length) {
            return false;
        }

        return a.args.every((arg, i) => arg === b.args[i]);
    }

    if (a.type === VAsyncValidatorNodeType.Compound && b.type === VAsyncValidatorNodeType.Compound) {
        if (a.mixer !== b.mixer || a.children.length !== b.children.length) {
            return false;
        }

        return a.children.every((v, i) => isValidatorEqual(v, b.children[i]));
    }

    return false;
}

function createValidators(node?: VAsyncValidatorNode): AsyncValidatorFn[] {
    return node ? arrayify(createValidator(node)) : [];
}

function createValidator(node: VAsyncValidatorNode): AsyncValidatorFn | AsyncValidatorFn[] {
    if (node.type === VAsyncValidatorNodeType.Simple) {
        return node.validator;
    } else if (node.type === VAsyncValidatorNodeType.Factory) {
        return node.factory(...node.args);
    } else {
        return node.mixer(flatMap(node.children, child => arrayify(createValidator(child))));
    }
}
