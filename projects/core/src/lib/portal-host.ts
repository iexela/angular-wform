import { WForm } from './form';

export class WPortalHost {
    connections: Record<string, WForm<any>> = {};

    setForm(name: string, form: WForm<any>): void {
        this.connections[name] = form;
    }

    getForm(name: string): WForm<any> {
        return this.connections[name];
    }

    resetForm(name: string): void {
        delete this.connections[name];
    }
}