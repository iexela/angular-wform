import { getLastFormNode } from '../..';
import { buildTreeTranslator } from '../tree-translator';
import { sControl, sRoot } from './basic';
import { sampleFormFactory } from './builder';
import { whenAll, whenApac, whenCreateOrEditMode, whenLanguage } from './conditions';
import { FormSampleMode, Location } from './model';
import { VSampleTreeVisitor } from './translator';

describe('staged example', () => {
    it('test', () => {
        const formFactory = sampleFormFactory(buildTreeTranslator(new VSampleTreeVisitor({
            location: Location.APAC,
            language: 'ch',
        })));
        const form = formFactory(() => sRoot({ mode: FormSampleMode.View }, {
            firstName: sControl({
                visible: true,
                required: whenAll(whenApac, whenLanguage('ch')),
            }),
            lastName: sControl({
                visible: whenCreateOrEditMode,
            }),
        })).build({ firstName: null, lastName: 'M' });

        expect(form.get('firstName').errors).toEqual({ required: true });
        expect(form.get('lastName').disabled).toBe(true);
        expect(getLastFormNode(form.get('lastName')).data.visible).toBe(false);
    });
});
