import { AbstractControl } from '@angular/forms';
import { processNode } from './controls';
import { VReconcilationRequest } from './model';
import { VRenderContext } from './render-context';

export function reconcile(request: VReconcilationRequest): AbstractControl {
    return processNode(
        new VRenderContext(request.flags),
        request.node,
        request.control,
    );
}
