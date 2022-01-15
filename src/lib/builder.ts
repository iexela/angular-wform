import { AbstractControl } from '@angular/forms';
import { WForm, WFormOptions } from './form';
import { ExtractFormValue, WFormNode, WFormNodeFactory, WValidationStrategy } from './model';
import { DEFAULT_RECONCILATION_OPTIONS, WKeyGenerator } from './reconcilation';
import { calculateValue } from './utils';

export interface WFormBuilderFactory {
    <TValue = any, TFormNode extends WFormNode = WFormNode>(factory: WFormNodeFactory<TValue, TFormNode>): WFormBuilder<ExtractFormValue<TValue, TFormNode>>;
}

export class WFormBuilder<T> {
    private _options: WFormOptions = {
        ...DEFAULT_RECONCILATION_OPTIONS,
        updateOnChange: true,
    };

    constructor(private _factory: WFormNodeFactory<T, WFormNode>) {
    }

    validationStrategy(strategy: WValidationStrategy): this {
        this._options.validationStrategy = strategy;

        return this;
    }

    updateOnChange(updateOnChange: boolean = true): this {
        this._options.updateOnChange = updateOnChange;
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
