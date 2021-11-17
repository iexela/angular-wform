import { AbstractControl } from '@angular/forms';
import { VFormNode } from '../model';

export enum VReconcilationType {
    Update, Patch
}

export enum VValidationStrategy {
    Append,
    Replace,
}

export interface VFormFlags {
    validationStrategy: VValidationStrategy;
    updateOnChange: boolean;
}

export interface VReconcilationRequest {
    flags: VFormFlags;
    node: VFormNode;
    control?: AbstractControl;
}
