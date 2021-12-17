import { AbstractControl, ValidatorFn } from '@angular/forms';
import { WValidatorNode,WValidatorNodeType } from '../model';
import { arrayDiffUnordered, arrayify, flatMap } from '../utils';
import { canAccessListOfValidators, canManageValidatorsIndividually } from './flags';
import { createValidatorBundle, ValidatorBundle } from './internal-model';
import { WValidationStrategy } from './model';
import { getLastFormNodeOrNothing, getLastValidatorBundleOrCreate } from './registry';
import { WRenderContext } from './render-context';

interface Control12ValidatorsApi {
    hasValidator(validator: ValidatorFn): boolean;
    addValidators(validator: ValidatorFn): void;
    removeValidators(validator: ValidatorFn): void;
}

export function processValidators(ctx: WRenderContext, node?: WValidatorNode, control?: AbstractControl): ValidatorBundle {    
    if (!control) {
        return createValidatorBundle(createValidators(node));
    }

    const lastNode = getLastFormNodeOrNothing(control)?.validator;
    const lastValidatorBundle = getLastValidatorBundleOrCreate(control);

    return applyValidators(
        ctx,
        ctx.options.validationStrategy,
        control,
        lastValidatorBundle,
        areValidatorsChanged(lastNode, node) ? createValidators(node) : lastValidatorBundle.children,
    );
}

function applyValidators(ctx: WRenderContext,
                         strategy: WValidationStrategy,
                         control: AbstractControl,
                         lastValidatorBundle: ValidatorBundle,
                         nextValidators: ValidatorFn[]): ValidatorBundle {
    switch (strategy) {
        case WValidationStrategy.Append:
            if (canManageValidatorsIndividually) {
                return appendValidatorsIndividually(ctx, control as Control12ValidatorsApi, lastValidatorBundle, nextValidators);
            } else if (canAccessListOfValidators) {
                return appendValidatorsInBulk(ctx, control, lastValidatorBundle, nextValidators);
            } else {
                return appendValidatorsByComposing(ctx, control, lastValidatorBundle, nextValidators);
            }
        case WValidationStrategy.Replace:
            return replaceValidators(ctx, control, lastValidatorBundle, nextValidators);
        default:
            throw Error(`Unsupported validation strategy: '${WValidationStrategy[strategy]}'`);
    }
}

function appendValidatorsIndividually(ctx: WRenderContext, control: Control12ValidatorsApi, lastValidatorBundle: ValidatorBundle, nextValidators: ValidatorFn[]): ValidatorBundle {
    const { added, removed, common } = arrayDiffUnordered(lastValidatorBundle.children, nextValidators);

    const hasCompiledValidator = lastValidatorBundle.compiled && control.hasValidator(lastValidatorBundle.compiled);
    const hasValidators = added.length > 0 || common.length > 0;
    const areValidatorsModified = added.length > 0 || removed.length > 0;

    if (lastValidatorBundle.compiled && !hasCompiledValidator) {
        ctx.markValidatorsChanged();
        lastValidatorBundle.compiled.dispose();
    }

    if (hasValidators) {
        if (!hasCompiledValidator) {
            ctx.markValidatorsChanged();
            const bundle = createValidatorBundle(added.concat(common));
            control.addValidators(bundle.compiled!);
            return bundle;
        } else if (areValidatorsModified) {
            ctx.markValidatorsChanged();
            return modifyValidatorBundle(lastValidatorBundle, added.concat(common));
        }
    } else if (hasCompiledValidator) {
        ctx.markValidatorsChanged();
        lastValidatorBundle.compiled!.dispose();
        control.removeValidators(lastValidatorBundle.compiled!);
        return createValidatorBundle([]);
    }

    return lastValidatorBundle;
}

function appendValidatorsInBulk(ctx: WRenderContext, control: AbstractControl, lastValidatorBundle: ValidatorBundle, nextValidators: ValidatorFn[]): ValidatorBundle {
    const { added, removed, common } = arrayDiffUnordered(lastValidatorBundle.children, nextValidators);

    const validators = getControlValidators(control);
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
            const bundle = createValidatorBundle(added.concat(common));
            control.setValidators([...validators, bundle.compiled!]);
            return bundle;
        } else if (areValidatorsModified) {
            ctx.markValidatorsChanged();
            return modifyValidatorBundle(lastValidatorBundle, added.concat(common));
        }
    } else if (hasCompiledValidator) {
        ctx.markValidatorsChanged();
        lastValidatorBundle.compiled!.dispose();
        control.setValidators(validators.filter(v => v !== lastValidatorBundle.compiled));
        return createValidatorBundle([]);
    }

    return lastValidatorBundle;
}

function appendValidatorsByComposing(ctx: WRenderContext, control: AbstractControl, lastValidatorBundle: ValidatorBundle, nextValidators: ValidatorFn[]): ValidatorBundle {
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
            const bundle = createValidatorBundle(added.concat(common), control.validator || undefined);
            control.validator = bundle.compiled || null;
            return bundle;
        } else if (areValidatorsModified) {
            ctx.markValidatorsChanged();
            return modifyValidatorBundle(lastValidatorBundle, added.concat(common));
        }
    } else if (hasCompiledValidator) {
        ctx.markValidatorsChanged();
        lastValidatorBundle.compiled!.dispose();
        control.validator = null;
        return createValidatorBundle([]);
    }

    return lastValidatorBundle;
}

function replaceValidators(ctx: WRenderContext, control: AbstractControl, lastValidatorBundle: ValidatorBundle, nextValidators: ValidatorFn[]): ValidatorBundle {
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
            const bundle = createValidatorBundle(added.concat(common));
            control.validator = bundle.compiled || null;
            return bundle;
        } else if (areValidatorsModified) {
            ctx.markValidatorsChanged();
            lastValidatorBundle.compiled!.setValidators(added.concat(common));
            return lastValidatorBundle;
        }
    } else {
        if (hasCompiledValidator) {
            ctx.markValidatorsChanged();
            lastValidatorBundle.compiled!.dispose();
        }
        if (control.validator) {
            ctx.markValidatorsChanged();
            control.validator = null;
        }
        return createValidatorBundle([]);
    }

    return lastValidatorBundle;
}

function modifyValidatorBundle(bundle: ValidatorBundle, validators: ValidatorFn[]): ValidatorBundle {
    if (!bundle.compiled) {
        return createValidatorBundle(validators);
    }

    bundle.compiled.setValidators(validators);
    return bundle;
}

function getControlValidators(control: AbstractControl): ValidatorFn[] {
    return arrayify((control as any)._rawValidators);
}

function areValidatorsChanged(a?: WValidatorNode, b?: WValidatorNode): boolean {
    if ((a == null) !== (b == null)) {
        return true;
    }

    if (a == null || b == null) {
        return false;
    }

    return !isValidatorEqual(a, b);
}

function isValidatorEqual(a: WValidatorNode, b: WValidatorNode): boolean {
    if (a.type === WValidatorNodeType.Simple && b.type === WValidatorNodeType.Simple) {
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

    if (a.type === WValidatorNodeType.Factory && b.type === WValidatorNodeType.Factory) {
        if (a.factory !== b.factory || a.args.length !== b.args.length) {
            return false;
        }

        return a.args.every((arg, i) => arg === b.args[i]);
    }

    if (a.type === WValidatorNodeType.Compound && b.type === WValidatorNodeType.Compound) {
        if (a.mixer !== b.mixer || a.children.length !== b.children.length) {
            return false;
        }

        return a.children.every((v, i) => isValidatorEqual(v, b.children[i]));
    }

    return false;
}

function createValidators(node?: WValidatorNode): ValidatorFn[] {
    return node ? arrayify(createValidator(node)) : [];
}

function createValidator(node: WValidatorNode): ValidatorFn | ValidatorFn[] {
    if (node.type === WValidatorNodeType.Simple) {
        return node.validator;
    } else if (node.type === WValidatorNodeType.Factory) {
        return node.factory(...node.args);
    } else {
        return node.mixer(flatMap(node.children, child => arrayify(createValidator(child))));
    }
}
