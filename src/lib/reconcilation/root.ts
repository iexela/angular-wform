import { AbstractControl } from '@angular/forms';
import { VFormNode, VThisFormNode } from '..';
import { VFormNodeType } from '../model';
import { processNode } from './controls';
import { VReconcilationRequest } from './model';
import { getRoot } from './registry';
import { VRenderContext } from './render-context';

function normalizeRootNode(node: VThisFormNode, control?: AbstractControl): VThisFormNode {
    const root = control && getRoot(control);
    return root ? { ...node, disabled: root.disabled || node.disabled } : node;
}

export function reconcile(request: VReconcilationRequest): AbstractControl {
    const { node } = request;

    if (!node) {
        throw Error('Root node is nil');
    }

    if ((node.type as any) === VFormNodeType.Placeholder) {
        throw Error('Root cannot be rendered into placeholder');
    }

    if (node.type === VFormNodeType.Portal) {
        throw Error('Root cannot be rendered into portal');
    }

    return processNode(
        new VRenderContext(request.options, request.portalHost),
        undefined,
        normalizeRootNode(request.node as VThisFormNode, request.control),
        request.value,
        request.control,
    );
}
