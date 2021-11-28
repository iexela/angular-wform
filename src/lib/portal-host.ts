import { VForm } from './form';

export class VPortalHost {
    connections: Record<string, VForm<any>> = {};

    setForm(name: string, form: VForm<any>): void {
        this.connections[name] = form;
    }

    getForm(name: string): VForm<any> {
        return this.connections[name];
    }

    resetForm(name: string): void {
        delete this.connections[name];
    }
}