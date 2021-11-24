import { AbstractControl, ValidatorFn } from '@angular/forms';
import { VValidatorNode,VValidatorNodeType } from '../model';
import { arrayDiffUnordered, arrayify, flatMap } from '../utils';
import { canAccessListOfValidators, canManageValidatorsIndividually } from './flags';
import { createValidatorBundle, ValidatorBundle } from './internal-model';
import { VValidationStrategy } from './model';
import { getLastFormNode, getLastValidatorBundleOrCreate } from './registry';
import { VRenderContext } from './render-context';

interface Control12ValidatorsApi {
    hasValidator(validator: ValidatorFn): boolean;
    addValidators(validator: ValidatorFn): void;
    removeValidators(validator: ValidatorFn): void;
}

export function processValidators(ctx: VRenderContext, node?: VValidatorNode, control?: AbstractControl): ValidatorBundle {    
    if (!control) {
        return createValidatorBundle(createValidators(node));
    }

    const lastNode = getLastFormNode(control).validator;
    const lastValidatorBundle = getLastValidatorBundleOrCreate(control);

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
                         lastValidatorBundle: ValidatorBundle,
                         nextValidators: ValidatorFn[]): ValidatorBundle {
    switch (strategy) {
        case VValidationStrategy.Append:
            if (canManageValidatorsIndividually) {
                return appendValidatorsIndividually(ctx, control as Control12ValidatorsApi, lastValidatorBundle, nextValidators);
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

function appendValidatorsIndividually(ctx: VRenderContext, control: Control12ValidatorsApi, lastValidatorBundle: ValidatorBundle, nextValidators: ValidatorFn[]): ValidatorBundle {
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

function appendValidatorsInBulk(ctx: VRenderContext, control: AbstractControl, lastValidatorBundle: ValidatorBundle, nextValidators: ValidatorFn[]): ValidatorBundle {
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

function appendValidatorsByComposing(ctx: VRenderContext, control: AbstractControl, lastValidatorBundle: ValidatorBundle, nextValidators: ValidatorFn[]): ValidatorBundle {
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
            const bundle = createValidatorBundle(added.concat(common).concat(arrayify(control.validator)));
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

function replaceValidators(ctx: VRenderContext, control: AbstractControl, lastValidatorBundle: ValidatorBundle, nextValidators: ValidatorFn[]): ValidatorBundle {
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

function areValidatorsChanged(a?: VValidatorNode, b?: VValidatorNode): boolean {
    if ((a == null) !== (b == null)) {
        return true;
    }

    if (a == null || b == null) {
        return false;
    }

    return !isValidatorEqual(a, b);
}

function isValidatorEqual(a: VValidatorNode, b: VValidatorNode): boolean {
    if (a.type === VValidatorNodeType.Simple && b.type === VValidatorNodeType.Simple) {
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

    if (a.type === VValidatorNodeType.Factory && b.type === VValidatorNodeType.Factory) {
        if (a.factory !== b.factory || a.args.length !== b.args.length) {
            return false;
        }

        return a.args.every((arg, i) => arg === b.args[i]);
    }

    if (a.type === VValidatorNodeType.Compound && b.type === VValidatorNodeType.Compound) {
        if (a.mixer !== b.mixer || a.children.length !== b.children.length) {
            return false;
        }

        return a.children.every((v, i) => isValidatorEqual(v, b.children[i]));
    }

    return false;
}

function createValidators(node?: VValidatorNode): ValidatorFn[] {
    return node ? arrayify(createValidator(node)) : [];
}

function createValidator(node: VValidatorNode): ValidatorFn | ValidatorFn[] {
    if (node.type === VValidatorNodeType.Simple) {
        return node.validator;
    } else if (node.type === VValidatorNodeType.Factory) {
        return node.factory(...node.args);
    } else {
        return node.mixer(flatMap(node.children, child => arrayify(createValidator(child))));
    }
}
