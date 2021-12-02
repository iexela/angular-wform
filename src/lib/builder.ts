import { AbstractControl } from '@angular/forms';
import { ExtractFormValue, VFormNode, VFormTranslator, VTranslatedFormNodeFactory } from '.';
import { VForm } from './form';
import { VFormNodeFactory } from './model';
import { VFormOptions, VValidationStrategy } from './reconcilation';
import { VKeyGenerator } from './reconcilation/model';
import { calculateValue } from './utils';

export interface VFormBuilderFactory {
    use<TNode>(env: VFormTranslator<TNode>): VTranslatedFormBuilderFactory<TNode>;
    <TValue = any, TFormNode extends VFormNode = VFormNode>(factory: VFormNodeFactory<TValue, TFormNode>): VFormBuilder<ExtractFormValue<TValue, TFormNode>>;
}

export interface VTranslatedFormBuilderFactory<TNode> {
    <TValue>(factory: VTranslatedFormNodeFactory<TValue, TNode>): VFormBuilder<TValue>;
}

function nilKeyGenerator(): undefined {
    return;
}

export class VFormBuilder<T> {
    private _options: VFormOptions = {
        validationStrategy: VValidationStrategy.Append,
        updateOnChange: false,
        keyGenerator: nilKeyGenerator,
        strict: true,
    }

    constructor(private _factory: VFormNodeFactory<T, VFormNode>) {
    }

    validationStrategy(strategy: VValidationStrategy): this {
        this._options.validationStrategy = strategy;

        return this;
    }

    updateOnChange(): this {
        this._options.updateOnChange = true;
        return this;
    }

    keyGenerator(generator: VKeyGenerator): this {
        this._options.keyGenerator = generator;
        return this;
    }

    lenient(lenient: boolean = true): this {
        this._options.strict = !lenient;
        return this;
    }

    build<U extends T>(value: U): VForm<T> {
        return new VForm<T>(
            this._factory,
            {
                ...this._options,
            },
            value,
        );
    }

    attach(control: AbstractControl): VForm<T> {
        return new VForm<T>(
            this._factory,
            {
                ...this._options,
            },
            calculateValue(control),
            control,
        );
    }
}

export function vForm<TValue = any, TFormNode extends VFormNode = VFormNode>(factory: VFormNodeFactory<ExtractFormValue<TValue, TFormNode>, TFormNode>): VFormBuilder<ExtractFormValue<TValue, TFormNode>> {
    return new VFormBuilder(factory);
}

vForm.use = <TNode>(translator: VFormTranslator<TNode>): VTranslatedFormBuilderFactory<TNode> => {
    function vEnvForm<TValue>(factory: VTranslatedFormNodeFactory<TValue, TNode>): VFormBuilder<TValue> {
        return vForm(value => translator(factory(value)) as any);
    }
    
    return vEnvForm as any;
};
