import { VFormNode, VFormNodeType, VFormPlaceholder, VPathElement } from '../model';
import { Maybe } from '../common';
import { VFormArray, VFormGroup } from '../model';
import { VFormOptions } from '../reconcilation';
import { VPortalHost } from '../portal-host';

export class VRenderContext {
    validatorsChanged = false;

    isUsedNode = (node: VFormNode | VFormPlaceholder): node is VFormNode => {
        if (node == null) {
            // It is intentional, null error is catched later in processNode
            return true;
        }

        switch (node.type) {
            case VFormNodeType.Placeholder:
                return false;
            case VFormNodeType.Native:
                return node.control != null;
            case VFormNodeType.Portal:
                return this.portalHost.getForm(node.name) != null;
            default:
                return true;
        }
    };
    
    private _currentPath: VPathElement[] = [];
    private _disabled: boolean[] = [];

    constructor(readonly options: VFormOptions, readonly portalHost: VPortalHost) {}

    tryDisabled(disabled: boolean): boolean {
        const disabledTop = this._disabled.length === 0 ? false : this._disabled[this._disabled.length - 1];

        return disabledTop ? true : disabled;
    }

    markValidatorsChanged(): void {
        this.validatorsChanged = true;
    }

    unmarkValidatorsChanged(): void {
        this.validatorsChanged = false;
    }

    push(name: Maybe<VPathElement>, node: VFormGroup | VFormArray): void {
        if (name != null) {
            this._currentPath.push(name);
        }
        this._disabled.push(this.tryDisabled(node.disabled));
    }

    pop(): void {
        this._currentPath.pop();
        this._disabled.pop();
    }

    pathTo(name?: VPathElement): VPathElement[] {
        if (name == null) {
            return this._currentPath.concat();
        }
        return this._currentPath.concat(name);
    }
}
