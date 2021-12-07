import { WFormBuilder } from '../../builder';
import { TransformFn } from '../../common';
import { WFormNode } from '../../model';
import { ExtractFormSampleValue, FormSampleNode, FormSampleNodeFactory } from './model';

export interface FormSampleBuilderFactory {
    <TValue = any, TNode extends FormSampleNode = FormSampleNode>(factory: FormSampleNodeFactory<TValue, TNode>): WFormBuilder<ExtractFormSampleValue<TValue, TNode>>;
}

export function sampleFormFactory(translator: TransformFn<any, WFormNode>): FormSampleBuilderFactory {
    function create(factory: FormSampleNodeFactory<any, any>): WFormBuilder<any> {
        return new WFormBuilder(value => translator(factory(value)));
    }

    return create;
}
