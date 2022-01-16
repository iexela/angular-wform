import { AbstractControl } from '@angular/forms';
import { WFormNodeType, WThisFormNode } from '../model';
import { processNode } from './controls';
import { WReconcilationRequest } from './model';
import { getRoot } from './registry';
import { WRenderContext } from './render-context';

function normalizeRootNode(node: WThisFormNode, control?: AbstractControl): WThisFormNode {
    const root = control && getRoot(control);
    return root ? { ...node, disabled: root.disabled || node.disabled } : node;
}

export function reconcile(request: WReconcilationRequest): AbstractControl {
    const { node } = request;

    if (!node) {
        throw Error('Root node is nil');
    }

    if ((node.type as any) === WFormNodeType.Placeholder) {
        throw Error('Root cannot be rendered into placeholder');
    }

    if (node.type === WFormNodeType.Portal) {
        throw Error('Root cannot be rendered into portal');
    }

    return processNode(
        new WRenderContext(request.options, request.portalHost),
        undefined,
        normalizeRootNode(request.node as WThisFormNode, request.control),
        request.value,
        request.control,
    );
}
