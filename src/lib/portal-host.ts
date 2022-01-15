import { AbstractControl } from '@angular/forms';

export interface WPortal<T> {
    control: AbstractControl;

    setValue(value: T): void;
    update(): void;
}

export class WPortalHost {
    connections: Record<string, WPortal<any>> = {};

    connect(name: string, control: WPortal<any>): void {
        this.connections[name] = control;
    }

    get(name: string): WPortal<any> {
        return this.connections[name];
    }

    disconnect(name: string): void {
        delete this.connections[name];
    }
}
