import { VFormArray, VFormGroup } from '../model';
import { VFormFlags } from '../reconcilation';

export class VRenderContext {
    validatorsChanged = false;

    private _disabled: boolean[] = [];

    constructor(readonly flags: VFormFlags) {}

    tryDisabled(disabled: boolean) {
        const disabledTop = this._disabled.length === 0 ? false : this._disabled[this._disabled.length - 1];

        return disabledTop ? true : disabled;
    }

    markValidatorsChanged(): void {
        this.validatorsChanged = true;
    }

    unmarkValidatorsChanged(): void {
        this.validatorsChanged = false;
    }

    push(node: VFormGroup | VFormArray): void {
        this._disabled.push(this.tryDisabled(node.disabled));
    }

    pop(): void {
        this._disabled.pop();
    }
}
