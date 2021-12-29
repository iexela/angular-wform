import { AbstractControl, AsyncValidatorFn } from '@angular/forms';
import { WAsyncValidatorNode, WAsyncValidatorNodeType, WValidationStrategy } from '../model';
import { arrayDiffUnordered, arrayify, flatMap } from '../utils';
import { canAccessListOfValidators, canManageValidatorsIndividually } from './flags';
import { AsyncValidatorBundle, createAsyncValidatorBundle } from './internal-model';
import { getLastAsyncValidatorBundle, getLastFormNodeOrNothing } from './registry';
import { WRenderContext } from './render-context';

interface Control12AsyncValidatorsApi {
    hasAsyncValidator(validator: AsyncValidatorFn): boolean;
    addAsyncValidators(validator: AsyncValidatorFn): void;
    removeAsyncValidators(validator: AsyncValidatorFn): void;
}

export function processAsyncValidators(ctx: WRenderContext, strategy?: WValidationStrategy, node?: WAsyncValidatorNode, control?: AbstractControl): AsyncValidatorBundle {
    if (!control) {
        return createAsyncValidatorBundle(createValidators(node));
    }

    const lastNode = getLastFormNodeOrNothing(control)?.asyncValidator;
    const lastValidatorBundle = getLastAsyncValidatorBundle(control);

    return applyValidators(
        ctx,
        strategy != null ? strategy : ctx.options.validationStrategy,
        control,
        lastValidatorBundle,
        areValidatorsChanged(lastNode, node) ? createValidators(node) : lastValidatorBundle.children,
    );
}

function applyValidators(ctx: WRenderContext,
                         strategy: WValidationStrategy,
                         control: AbstractControl,
                         lastValidatorBundle: AsyncValidatorBundle,
                         nextValidators: AsyncValidatorFn[]): AsyncValidatorBundle {
    switch (strategy) {
        case WValidationStrategy.Append:
            if (canManageValidatorsIndividually) {
                return appendValidatorsIndividually(ctx, control as Control12AsyncValidatorsApi, lastValidatorBundle, nextValidators);
            } else if (canAccessListOfValidators) {
                return appendValidatorsInBulk(ctx, control, lastValidatorBundle, nextValidators);
            } else {
                return appendValidatorsByComposing(ctx, control, lastValidatorBundle, nextValidators);
            }
        case WValidationStrategy.Replace:
            return replaceValidators(ctx, control, lastValidatorBundle, nextValidators);
        default:
            throw new Error(`Unsupported validation strategy: '${WValidationStrategy[strategy]}'`);
    }
}

function appendValidatorsIndividually(ctx: WRenderContext, control: Control12AsyncValidatorsApi, lastValidatorBundle: AsyncValidatorBundle, nextValidators: AsyncValidatorFn[]): AsyncValidatorBundle {
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

function appendValidatorsInBulk(ctx: WRenderContext, control: AbstractControl, lastValidatorBundle: AsyncValidatorBundle, nextValidators: AsyncValidatorFn[]): AsyncValidatorBundle {
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

function appendValidatorsByComposing(ctx: WRenderContext, control: AbstractControl, lastValidatorBundle: AsyncValidatorBundle, nextValidators: AsyncValidatorFn[]): AsyncValidatorBundle {
    const { added, removed, common } = arrayDiffUnordered(lastValidatorBundle.children, nextValidators);

    const hasCompiledValidator = lastValidatorBundle.compiled && lastValidatorBundle.compiled === control.asyncValidator;
    const hasValidators = added.length > 0 || common.length > 0;
    const areValidatorsModified = added.length > 0 || removed.length > 0;

    if (lastValidatorBundle.compiled && !hasCompiledValidator) {
        ctx.markValidatorsChanged();
        lastValidatorBundle.compiled.dispose();
    }

    if (hasValidators) {
        if (!hasCompiledValidator) {
            ctx.markValidatorsChanged();
            const bundle = createAsyncValidatorBundle(added.concat(common), control.asyncValidator || undefined);
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

function replaceValidators(ctx: WRenderContext, control: AbstractControl, lastValidatorBundle: AsyncValidatorBundle, nextValidators: AsyncValidatorFn[]): AsyncValidatorBundle {
    const { added, removed, common } = arrayDiffUnordered(lastValidatorBundle.children, nextValidators);

    const hasCompiledValidator = lastValidatorBundle.compiled && lastValidatorBundle.compiled === control.asyncValidator;
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

function areValidatorsChanged(a?: WAsyncValidatorNode, b?: WAsyncValidatorNode): boolean {
    if ((a == null) !== (b == null)) {
        return true;
    }

    if (a == null || b == null) {
        return false;
    }

    return !isValidatorEqual(a, b);
}

function isValidatorEqual(a: WAsyncValidatorNode, b: WAsyncValidatorNode): boolean {
    if (a.type === WAsyncValidatorNodeType.Simple && b.type === WAsyncValidatorNodeType.Simple) {
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

    if (a.type === WAsyncValidatorNodeType.Factory && b.type === WAsyncValidatorNodeType.Factory) {
        if (a.factory !== b.factory || a.args.length !== b.args.length) {
            return false;
        }

        return a.args.every((arg, i) => arg === b.args[i]);
    }

    if (a.type === WAsyncValidatorNodeType.Compound && b.type === WAsyncValidatorNodeType.Compound) {
        if (a.mixer !== b.mixer || a.children.length !== b.children.length) {
            return false;
        }

        return a.children.every((v, i) => isValidatorEqual(v, b.children[i]));
    }

    return false;
}

function createValidators(node?: WAsyncValidatorNode): AsyncValidatorFn[] {
    return node ? arrayify(createValidator(node)) : [];
}

function createValidator(node: WAsyncValidatorNode): AsyncValidatorFn | AsyncValidatorFn[] {
    if (node.type === WAsyncValidatorNodeType.Simple) {
        return node.validator;
    } else if (node.type === WAsyncValidatorNodeType.Factory) {
        return node.factory(...node.args);
    } else {
        return node.mixer(flatMap(node.children, child => arrayify(createValidator(child))));
    }
}
