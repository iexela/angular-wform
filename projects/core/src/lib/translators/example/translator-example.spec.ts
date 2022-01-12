import { getLastFormNode } from '../../reconcilation';
import { buildTreeTranslator } from '../tree-translator';
import { sControl, sRoot } from './basic';
import { sampleFormFactory } from './builder';
import { whenAll, whenApac, whenCreateOrEditMode, whenHasPermission, whenInRole, whenLanguage, whenNot } from './conditions';
import { FormSampleMode, Location } from './model';
import { VSampleTreeVisitor } from './translator';

describe('translator example', () => {
    it('test', () => {
        const sForm = sampleFormFactory(buildTreeTranslator(new VSampleTreeVisitor({
            location: Location.APAC,
            language: 'ch',
            role: 'MANAGER',
            permissions: ['EDIT_FIRST_NAME', 'EDIT_LAST_NAME'],
        })));
        const form = sForm(() => sRoot({ mode: FormSampleMode.View }, {
            firstName: sControl({
                visible: true,
                required: whenAll(whenApac, whenLanguage('ch'), whenHasPermission('EDIT_FIRST_NAME')),
            }),
            lastName: sControl({
                visible: whenAll(whenCreateOrEditMode, whenHasPermission('EDIT_LAST_NAME')),
            }),
            age: sControl({
                enabled: whenNot(whenInRole('MANAGER')),
            }),
            position: sControl({
                enabled: whenInRole('MANAGER'),
            }),
        })).build({ firstName: null, lastName: 'M' });

        expect(form.get('firstName').errors).toEqual({ required: true });
        expect(form.get('lastName').disabled).toBe(true);
        expect(getLastFormNode(form.get('lastName')).data['visible']).toBe(false);
        expect(form.get('age').disabled).toBe(true);
        expect(form.get('position').disabled).toBe(false);
    });
});
