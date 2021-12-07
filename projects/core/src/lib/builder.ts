import { AbstractControl } from '@angular/forms';
import { ExtractFormValue, WFormNode } from '.';
import { WForm } from './form';
import { WFormNodeFactory } from './model';
import { WFormOptions, WValidationStrategy } from './reconcilation';
import { WKeyGenerator } from './reconcilation/model';
import { calculateValue } from './utils';

export interface WFormBuilderFactory {
    <TValue = any, TFormNode extends WFormNode = WFormNode>(factory: WFormNodeFactory<TValue, TFormNode>): WFormBuilder<ExtractFormValue<TValue, TFormNode>>;
}

function nilKeyGenerator(): undefined {
    return;
}

export class WFormBuilder<T> {
    private _options: WFormOptions = {
        validationStrategy: WValidationStrategy.Append,
        updateOnChange: false,
        keyGenerator: nilKeyGenerator,
        strict: true,
    }

    constructor(private _factory: WFormNodeFactory<T, WFormNode>) {
    }

    validationStrategy(strategy: WValidationStrategy): this {
        this._options.validationStrategy = strategy;

        return this;
    }

    updateOnChange(): this {
        this._options.updateOnChange = true;
        return this;
    }

    keyGenerator(generator: WKeyGenerator): this {
        this._options.keyGenerator = generator;
        return this;
    }

    lenient(lenient: boolean = true): this {
        this._options.strict = !lenient;
        return this;
    }

    build<U extends T>(value: U): WForm<T> {
        return new WForm<T>(
            this._factory,
            {
                ...this._options,
            },
            value,
        );
    }

    attach(control: AbstractControl): WForm<T> {
        return new WForm<T>(
            this._factory,
            {
                ...this._options,
            },
            calculateValue(control),
            control,
        );
    }
}

export function wForm<TValue = {}, TFormNode extends WFormNode = WFormNode>(factory: WFormNodeFactory<ExtractFormValue<TValue, TFormNode>, TFormNode>): WFormBuilder<ExtractFormValue<TValue, TFormNode>> {
    return new WFormBuilder(factory);
}
