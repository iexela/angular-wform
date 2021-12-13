import { AbstractControl } from '@angular/forms';
import { WPathElement } from '../model';
import { WFormNode } from '../model';
import { WPortalHost } from '../portal-host';

export enum WReconcilationType {
    Update, Patch
}

export enum WValidationStrategy {
    Append,
    Replace,
}

export interface WKeyGenerator {
    (path: WPathElement[], value: any): any;
}

export interface WFormReconcilationOptions {
    validationStrategy: WValidationStrategy;
    keyGenerator: WKeyGenerator;
    strict: boolean;
}

export interface WReconcilationRequest {
    options: WFormReconcilationOptions;
    portalHost: WPortalHost;
    node: WFormNode;
    value: any,
    control?: AbstractControl;
}

function nilKeyGenerator(): undefined {
    return;
}

export const DEFAULT_RECONCILATION_OPTIONS: WFormReconcilationOptions = {
    validationStrategy: WValidationStrategy.Append,
    keyGenerator: nilKeyGenerator,
    strict: true,
};
