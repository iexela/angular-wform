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

export interface WFormOptions {
    validationStrategy: WValidationStrategy;
    updateOnChange: boolean;
    keyGenerator: WKeyGenerator;
    strict: boolean;
}

export interface WReconcilationRequest {
    options: WFormOptions;
    portalHost: WPortalHost;
    node: WFormNode;
    value: any,
    control?: AbstractControl;
}
