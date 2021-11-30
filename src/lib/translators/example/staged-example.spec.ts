import { getLastFormNode, vForm } from '../..';
import { buildStagedTranslator } from '../staged';
import { vEnvControl, vEnvRoot } from './basic';
import { whenAll, whenApac, whenCreateOrEditMode, whenLanguage } from './conditions';
import { Location, VEnvFormMode } from './model';
import { VSampleStagedEnvironment } from './translator';

describe('staged example', () => {
    it('test', () => {
        const formFactory = vForm.use(buildStagedTranslator(new VSampleStagedEnvironment({
            location: Location.APAC,
            language: 'ch',
        })));
        const form = formFactory(() => vEnvRoot({ mode: VEnvFormMode.View }, {
            firstName: vEnvControl({
                visible: true,
                required: whenAll(whenApac, whenLanguage('ch')),
            }),
            lastName: vEnvControl({
                visible: whenCreateOrEditMode,
            }),
        })).build({ firstName: null, lastName: 'M' });

        expect(form.get('firstName').errors).toEqual({ required: true });
        expect(form.get('lastName').disabled).toBe(true);
        expect(getLastFormNode(form.get('lastName')).data.visible).toBe(false);
    });
});
