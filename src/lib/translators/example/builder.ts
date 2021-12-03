import { VFormBuilder, VFormNode } from 'src/lib';
import { TransformFn } from 'src/lib/common';
import { ExtractFormSampleValue, FormSampleNode, FormSampleNodeFactory } from './model';

export interface FormSampleBuilderFactory {
    <TValue = any, TNode extends FormSampleNode = FormSampleNode>(factory: FormSampleNodeFactory<TValue, TNode>): VFormBuilder<ExtractFormSampleValue<TValue, TNode>>;
}

export function sampleFormFactory(translator: TransformFn<any, VFormNode>): FormSampleBuilderFactory {
    function create(factory: FormSampleNodeFactory<any, any>): VFormBuilder<any> {
        return new VFormBuilder(value => translator(factory(value)));
    }

    return create;
}
