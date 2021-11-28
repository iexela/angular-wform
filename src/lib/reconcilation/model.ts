import { AbstractControl } from '@angular/forms';
import { VPathElement } from '..';
import { VFormNode } from '../model';
import { VPortalHost } from '../portal-host';

export enum VReconcilationType {
    Update, Patch
}

export enum VValidationStrategy {
    Append,
    Replace,
}

export interface VKeyGenerator {
    (path: VPathElement[], value: any): any;
}

export interface VFormOptions {
    validationStrategy: VValidationStrategy;
    updateOnChange: boolean;
    keyGenerator: VKeyGenerator;
    strict: boolean;
}

export interface VReconcilationRequest {
    options: VFormOptions;
    portalHost: VPortalHost;
    node: VFormNode;
    value: any,
    control?: AbstractControl;
}
