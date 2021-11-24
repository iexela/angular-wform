import { Maybe } from '../common';
import { VFormArray, VFormGroup } from '../model';
import { VFormOptions } from '../reconcilation';
import { VPathElement } from './model';

export class VRenderContext {
    validatorsChanged = false;
    
    private _currentPath: VPathElement[] = [];
    private _disabled: boolean[] = [];

    constructor(readonly options: VFormOptions) {}

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
