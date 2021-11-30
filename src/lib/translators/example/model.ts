import { AbstractControl } from '@angular/forms';
import { PredicateFn } from '../../common';
import { VAsyncValidatorNode, VFormHooks, VValidatorNode } from '../../model';

export enum VEnvFormNodeType {
    Control, Group, Array, Native, Portal, Placeholder, Options
}

export enum VEnvFormMode {
    Create, Edit, View
}

export enum Location {
    AMER, EMEA, APAC
}

export interface VEnv {
    mode: VEnvFormMode;
    location: Location;
    language: string;
}

export type VEnvPredicate = PredicateFn<VEnv>;

export interface VEnvFormNodeBase {
    key?: any;
    type: VEnvFormNodeType;
    visible: VEnvPredicate;
    disabled: VEnvPredicate;
    validator?: VValidatorNode;
    asyncValidator?: VAsyncValidatorNode;
    dirty?: boolean;
    touched?: boolean;
}

export interface VEnvFormNodeCreatedBase extends VEnvFormNodeBase {
    updateOn?: VFormHooks;
}

export interface VEnvFormControl extends VEnvFormNodeCreatedBase {
    type: VEnvFormNodeType.Control;
    required: VEnvPredicate;
    value?: any;
}

export interface VEnvFormGroup extends VEnvFormNodeCreatedBase {
    type: VEnvFormNodeType.Group;
    children: Record<string, VEnvFormNode | VEnvFormPlaceholder>;
}

export interface VEnvFormArray extends VEnvFormNodeCreatedBase {
    type: VEnvFormNodeType.Array;
    children: (VEnvFormNode | VEnvFormPlaceholder)[];
}

export interface VEnvFormNative extends VEnvFormNodeBase {
    type: VEnvFormNodeType.Native;
    control?: AbstractControl;
    value?: any;
}

export interface VEnvFormPortal {
    type: VEnvFormNodeType.Portal;
    name: string;
}

export interface VEnvFormPlaceholder {
    type: VEnvFormNodeType.Placeholder;
}

export interface VEnvFormOptions {
    type: VEnvFormNodeType.Options;
    mode: VEnvFormMode;
    child: VEnvFormNode;
}

export type VEnvThisFormNode = VEnvFormControl | VEnvFormGroup | VEnvFormArray | VEnvFormNative;
export type VEnvFormNode = VEnvThisFormNode | VEnvFormPortal;
