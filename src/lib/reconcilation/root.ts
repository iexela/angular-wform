import { AbstractControl } from '@angular/forms';
import { VFormNodeType } from '..';
import { processNode } from './controls';
import { VReconcilationRequest } from './model';
import { VRenderContext } from './render-context';

export function reconcile(request: VReconcilationRequest): AbstractControl {
    const { node } = request;

    if (!node) {
        throw Error('Root node is nil');
    }

    if ((node.type as any) === VFormNodeType.Placeholder) {
        throw Error('Root cannot be rendered into placeholder');
    }

    return processNode(
        new VRenderContext(request.options),
        undefined,
        request.node,
        request.value,
        request.control,
    );
}
