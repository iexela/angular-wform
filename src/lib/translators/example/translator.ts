import { Validators } from '@angular/forms';
import { composeValidators, VFormArray, VFormControl, VFormGroup, VFormNative, VFormNodeType, VFormPortal, vValidator, VValidatorNode } from 'src/lib';
import { Maybe } from 'src/lib/common';
import { VFormNode } from 'src/lib/model';
import { arrayify } from 'src/lib/utils';
import { andValidators } from 'src/lib/validators';
import { VFormTreeVisitor, VFormTreeNodeType } from '../tree-translator';
import { Location, FormSampleArray, FormSampleControl, FormSampleGroup, FormSampleMode, FormSampleNative, FormSampleNode, FormSampleNodeType, FormSampleOptions, FormSamplePlaceholder, FormSamplePortal, SampleEnvironmentPredicate } from './model';

interface Options {
    location: Location;
    language: string;
}

export class VSampleTreeVisitor implements VFormTreeVisitor {
    private _options: Options;
    private _mode = FormSampleMode.View;
    private visible: boolean[] = [];

    constructor(options: Options) {
        this._options = options;
    }

    begin(): void {
        this._mode = FormSampleMode.View;
        this.visible = [];
    }

    end(): void {

    }

    resolveType(node: FormSampleNode | FormSamplePlaceholder | FormSampleOptions): VFormTreeNodeType {
        switch (node.type) {
            case FormSampleNodeType.Array:
                return VFormTreeNodeType.Array;
            case FormSampleNodeType.Group:
                return VFormTreeNodeType.Group;
            case FormSampleNodeType.Control:
                return VFormTreeNodeType.Control;
            case FormSampleNodeType.Native:
                return VFormTreeNodeType.Native;
            case FormSampleNodeType.Placeholder:
                return VFormTreeNodeType.Placeholder;
            case FormSampleNodeType.Portal:
                return VFormTreeNodeType.Portal;
            case FormSampleNodeType.Options:
                return VFormTreeNodeType.Options;
            default:
                throw new Error('Unknown node type');
        }
    }
    beginOptions(node: FormSampleOptions): void {
        this._mode = node.mode;
    }
    optionsChild(node: FormSampleOptions): FormSampleNode | FormSamplePlaceholder {
        return node.child;
    }
    endOptions(node: FormSampleOptions): void {
        
    }
    beginGroup(node: FormSampleGroup): void {
        this.visible.push(this.resolveBoolean(node.visible));
    }
    groupChildren(node: FormSampleGroup): Record<string, FormSampleNode | FormSamplePlaceholder> {
        return node.children;
    }
    endGroup(node: FormSampleGroup, children: Record<string, VFormNode>): VFormNode {
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
    beginArray(node: FormSampleArray): void {
        this.visible.push(this.resolveBoolean(node.visible));
    }
    arrayChildren(node: FormSampleArray): (FormSampleNode | FormSamplePlaceholder)[] {
        return node.children;
    }
    endArray(node: FormSampleGroup, children: VFormNode[]): VFormNode {
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
    control(node: FormSampleControl<any>): VFormControl<any> {
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
    native(node: FormSampleNative<any>): VFormNative<any> {
        return {
            type: VFormNodeType.Native,
            disabled: this.resolveBoolean(node.disabled),
            ...pick(node, ['value', 'dirty', 'touched', 'key', 'validator', 'asyncValidator']),
            data: {
                visible: this.tryVisible(this.resolveBoolean(node.visible)),
            },
        }
    }
    portal(node: FormSamplePortal): VFormPortal {
        return {
            type: VFormNodeType.Portal,
            name: node.name,
        };
    }

    private resolveBoolean(flag: SampleEnvironmentPredicate): boolean {
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
