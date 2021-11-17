import { VFormArray, VFormGroup } from '../model';
import { VFormFlags } from '../reconcilation';

export class VRenderContext {
    private _disabled: boolean[] = [];

    constructor(readonly flags: VFormFlags) {}

    tryDisabled(disabled: boolean) {
        const disabledTop = this._disabled.length === 0 ? false : this._disabled[this._disabled.length - 1];

        return disabledTop ? true : disabled;
    }

    push(node: VFormGroup | VFormArray): void {
        this._disabled.push(this.tryDisabled(node.disabled));
    }

    pop(): void {
        this._disabled.pop();
    }
}
