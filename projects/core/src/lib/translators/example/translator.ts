import { Validators } from '@angular/forms';
import { WFormArray, WFormControl, WFormGroup, WFormNative, WFormNodeType, WFormPortal, WValidatorNode } from '../../model';
import { Maybe } from '../../common';
import { WFormNode } from '../../model';
import { arrayify } from '../../utils';
import { andValidators, composeValidators, wValidator } from '../../validators';
import { WFormTreeVisitor, WFormTreeNodeType } from '../tree-translator';
import { Location, FormSampleArray, FormSampleControl, FormSampleGroup, FormSampleMode, FormSampleNative, FormSampleNode, FormSampleNodeType, FormSampleOptions, FormSamplePlaceholder, FormSamplePortal, SampleEnvironmentPredicate } from './model';

interface Options {
    location: Location;
    language: string;
}

export class VSampleTreeVisitor implements WFormTreeVisitor {
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

    resolveType(node: FormSampleNode | FormSamplePlaceholder | FormSampleOptions): WFormTreeNodeType {
        switch (node.type) {
            case FormSampleNodeType.Array:
                return WFormTreeNodeType.Array;
            case FormSampleNodeType.Group:
                return WFormTreeNodeType.Group;
            case FormSampleNodeType.Control:
                return WFormTreeNodeType.Control;
            case FormSampleNodeType.Native:
                return WFormTreeNodeType.Native;
            case FormSampleNodeType.Placeholder:
                return WFormTreeNodeType.Placeholder;
            case FormSampleNodeType.Portal:
                return WFormTreeNodeType.Portal;
            case FormSampleNodeType.Options:
                return WFormTreeNodeType.Options;
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
    endGroup(node: FormSampleGroup, children: Record<string, WFormNode>): WFormNode {
        const group: WFormGroup = {
            type: WFormNodeType.Group,
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
    endArray(node: FormSampleGroup, children: WFormNode[]): WFormNode {
        const array: WFormArray = {
            type: WFormNodeType.Array,
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
    control(node: FormSampleControl<any>): WFormControl<any> {
        const visible = this.tryVisible(this.resolveBoolean(node.visible));
        return {
            type: WFormNodeType.Control,
            disabled: !visible || this.resolveBoolean(node.disabled),
            ...pick(node, ['value', 'dirty', 'touched', 'updateOn', 'key', 'asyncValidator']),
            validator: createControlValidator(node.validator, this.resolveBoolean(node.required)),
            data: {
                visible,
            },
        };
    }
    native(node: FormSampleNative<any>): WFormNative<any> {
        return {
            type: WFormNodeType.Native,
            disabled: this.resolveBoolean(node.disabled),
            ...pick(node, ['value', 'dirty', 'touched', 'key', 'validator', 'asyncValidator']),
            data: {
                visible: this.tryVisible(this.resolveBoolean(node.visible)),
            },
        }
    }
    portal(node: FormSamplePortal): WFormPortal {
        return {
            type: WFormNodeType.Portal,
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

function createControlValidator(validator: Maybe<WValidatorNode>, required: boolean): Maybe<WValidatorNode> {
    if (validator && required) {
        return andValidators(Validators.required, composeValidators(...arrayify(validator)));
    } else if (validator) {
        return validator;
    } else if (required) {
        return wValidator(Validators.required);
    }
    return;
}
