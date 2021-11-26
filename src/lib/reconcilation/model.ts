import { AbstractControl } from '@angular/forms';
import { VFormNode } from '../model';

export enum VReconcilationType {
    Update, Patch
}

export enum VValidationStrategy {
    Append,
    Replace,
}

export type VPathElement = string | number;

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
    node: VFormNode;
    control?: AbstractControl;
}
