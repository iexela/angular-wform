import { AbstractControl } from '@angular/forms';
import { VFormTranslator, VTranslatedFormNodeFactory } from '.';
import { VForm } from './form';
import { VFormNodeFactory } from './model';
import { VFormOptions, VValidationStrategy } from './reconcilation';
import { VKeyGenerator } from './reconcilation/model';
import { calculateValue } from './utils';

export interface VFormBuilderFactory {
    use<TNode>(env: VFormTranslator<TNode>): VTranslatedFormBuilderFactory<TNode>;
    <T>(factory: VFormNodeFactory<T>): VFormBuilder<T>;
}

export interface VTranslatedFormBuilderFactory<TNode> {
    <T>(factory: VTranslatedFormNodeFactory<T, TNode>): VFormBuilder<T>;
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

    constructor(private _factory: VFormNodeFactory<T>) {
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

    build<U extends T>(value: U): VForm<U> {
        return new VForm(
            this._factory,
            {
                ...this._options,
            },
            value,
        );
    }

    attach<U extends T = T>(control: AbstractControl): VForm<U> {
        return new VForm<U>(
            this._factory,
            {
                ...this._options,
            },
            calculateValue(control),
            control,
        );
    }
}

export function vForm<T>(factory: VFormNodeFactory<T>): VFormBuilder<T> {
    return new VFormBuilder(factory);
}

vForm.use = <TNode>(translator: VFormTranslator<TNode>): VTranslatedFormBuilderFactory<TNode> => {
    function vEnvForm<T>(factory: VTranslatedFormNodeFactory<T, TNode>): VFormBuilder<T> {
        return vForm(value => translator(factory(value)));
    }
    
    return vEnvForm;
};
