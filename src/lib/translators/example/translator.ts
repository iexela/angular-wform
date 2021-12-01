import { Validators } from '@angular/forms';
import { composeValidators, VFormArray, VFormControl, VFormGroup, VFormNative, VFormNodeType, VFormPortal, vValidator, VValidatorNode } from 'src/lib';
import { Maybe } from 'src/lib/common';
import { VFormNode } from 'src/lib/model';
import { arrayify } from 'src/lib/utils';
import { andValidators } from 'src/lib/validators';
import { VFormStagedEnvironment, VStagedFormNodeType } from '../staged';
import { Location, VEnvFormArray, VEnvFormControl, VEnvFormGroup, VEnvFormMode, VEnvFormNative, VEnvFormNode, VEnvFormNodeType, VEnvFormOptions, VEnvFormPlaceholder, VEnvFormPortal, VEnvPredicate } from './model';

interface Options {
    location: Location;
    language: string;
}

export class VSampleStagedEnvironment implements VFormStagedEnvironment {
    private _options: Options;
    private _mode = VEnvFormMode.View;
    private visible: boolean[] = [];

    constructor(options: Options) {
        this._options = options;
    }

    begin(): void {
        this._mode = VEnvFormMode.View;
        this.visible = [];
    }

    end(): void {

    }

    resolveType(node: VEnvFormNode | VEnvFormPlaceholder | VEnvFormOptions): VStagedFormNodeType {
        switch (node.type) {
            case VEnvFormNodeType.Array:
                return VStagedFormNodeType.Array;
            case VEnvFormNodeType.Group:
                return VStagedFormNodeType.Group;
            case VEnvFormNodeType.Control:
                return VStagedFormNodeType.Control;
            case VEnvFormNodeType.Native:
                return VStagedFormNodeType.Native;
            case VEnvFormNodeType.Placeholder:
                return VStagedFormNodeType.Placeholder;
            case VEnvFormNodeType.Portal:
                return VStagedFormNodeType.Portal;
            case VEnvFormNodeType.Options:
                return VStagedFormNodeType.Options;
            default:
                throw new Error('Unknown node type');
        }
    }
    beginOptions(node: VEnvFormOptions): void {
        this._mode = node.mode;
    }
    optionsChild(node: VEnvFormOptions): VEnvFormNode | VEnvFormPlaceholder {
        return node.child;
    }
    endOptions(node: VEnvFormOptions): void {
        
    }
    beginGroup(node: VEnvFormGroup): void {
        this.visible.push(this.resolveBoolean(node.visible));
    }
    groupChildren(node: VEnvFormGroup): Record<string, VEnvFormNode | VEnvFormPlaceholder> {
        return node.children;
    }
    endGroup(node: VEnvFormGroup, children: Record<string, VFormNode>): VFormNode {
        const group: VFormGroup = {
            type: VFormNodeType.Group,
            disabled: this.resolveBoolean(node.disabled),
            ...pick(node, ['dirty', 'touched', 'updateOn', 'key', 'validator', 'asyncValidator']),
            data: {
                visible: this.tryVisible(this.resolveBoolean(node.visible)),
            },
            children,
        };
        this.visible.pop();
        return group;
    }
    beginArray(node: VEnvFormArray): void {
        this.visible.push(this.resolveBoolean(node.visible));
    }
    arrayChildren(node: VEnvFormArray): (VEnvFormNode | VEnvFormPlaceholder)[] {
        return node.children;
    }
    endArray(node: VEnvFormGroup, children: VFormNode[]): VFormNode {
        const array: VFormArray = {
            type: VFormNodeType.Array,
            disabled: this.resolveBoolean(node.disabled),
            ...pick(node, ['dirty', 'touched', 'updateOn', 'key', 'validator', 'asyncValidator']),
            data: {
                visible: this.tryVisible(this.resolveBoolean(node.visible)),
            },
            children,
        };
        this.visible.pop();
        return array;
    }
    control(node: VEnvFormControl): VFormControl<any> {
        const visible = this.tryVisible(this.resolveBoolean(node.visible));
        return {
            type: VFormNodeType.Control,
            disabled: !visible || this.resolveBoolean(node.disabled),
            ...pick(node, ['value', 'dirty', 'touched', 'updateOn', 'key', 'asyncValidator']),
            validator: createControlValidator(node.validator, this.resolveBoolean(node.required)),
            data: {
                visible,
            },
        };
    }
    native(node: VEnvFormNative): VFormNative<any> {
        return {
            type: VFormNodeType.Native,
            disabled: this.resolveBoolean(node.disabled),
            ...pick(node, ['value', 'dirty', 'touched', 'key', 'validator', 'asyncValidator']),
            data: {
                visible: this.tryVisible(this.resolveBoolean(node.visible)),
            },
        }
    }
    portal(node: VEnvFormPortal): VFormPortal {
        return {
            type: VFormNodeType.Portal,
            name: node.name,
        };
    }

    private resolveBoolean(flag: VEnvPredicate): boolean {
        return flag({
            mode: this._mode,
            location: this._options.location,
            language: this._options.language,
        });
    }

    private tryVisible(visible: boolean): boolean {
        const topVisible = this.visible.length > 0 ? this.visible[this.visible.length - 1] : true;
        return topVisible ? visible : false;
    }
}

function pick<T extends object, K extends keyof T>(obj: T, keys: K[]): { [P in K]: T[P] } {
    const result: T = {} as any;
    keys.forEach(key => {
        if (obj.hasOwnProperty(key)) {
            result[key] = obj[key];
        }
    })
    return result;
}

function createControlValidator(validator: Maybe<VValidatorNode>, required: boolean): Maybe<VValidatorNode> {
    if (validator && required) {
        return andValidators(Validators.required, composeValidators(...arrayify(validator)));
    } else if (validator) {
        return validator;
    } else if (required) {
        return vValidator(Validators.required);
    }
    return;
}
