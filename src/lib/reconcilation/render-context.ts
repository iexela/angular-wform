import { WFormNode, WFormNodeType, WFormPlaceholder, WPathElement } from '../model';
import { Maybe } from '../common';
import { WFormArray, WFormGroup } from '../model';
import { WFormOptions } from '../reconcilation';
import { WPortalHost } from '../portal-host';

export class WRenderContext {
    validatorsChanged = false;

    isUsedNode = (node: WFormNode | WFormPlaceholder): node is WFormNode => {
        if (node == null) {
            // It is intentional, null error is catched later in processNode
            return true;
        }

        switch (node.type) {
            case WFormNodeType.Placeholder:
                return false;
            case WFormNodeType.Native:
                return node.control != null;
            case WFormNodeType.Portal:
                return this.portalHost.getForm(node.name) != null;
            default:
                return true;
        }
    };
    
    private _currentPath: WPathElement[] = [];
    private _disabled: boolean[] = [];

    constructor(readonly options: WFormOptions, readonly portalHost: WPortalHost) {}

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

    push(name: Maybe<WPathElement>, node: WFormGroup | WFormArray): void {
        if (name != null) {
            this._currentPath.push(name);
        }
        this._disabled.push(this.tryDisabled(node.disabled));
    }

    pop(): void {
        this._currentPath.pop();
        this._disabled.pop();
    }

    pathTo(name?: WPathElement): WPathElement[] {
        if (name == null) {
            return this._currentPath.concat();
        }
        return this._currentPath.concat(name);
    }
}
