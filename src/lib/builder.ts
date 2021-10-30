import { Maybe } from './common';
import { VEnvFormNodeFactory, VEnvFormNodeType, VFormEnvironment } from './env-model';
import { VForm } from './form';
import { VFormNode, VFormNodeFactory } from './model';
import { VFormFlags, VValidationStrategy } from './reconcilation';
import { mapValues, pickBy } from './utils';

export interface VFormBuilderFactory {
    use<TNode>(env: VFormEnvironment<TNode>): VEnvFormBuilderFactory<TNode>;
    <T>(factory: VFormNodeFactory<T>): VFormBuilder<T>;
}

export interface VEnvFormBuilderFactory<TNode> {
    <T>(factory: VEnvFormNodeFactory<T, TNode>): VFormBuilder<T>;
}

export class VFormBuilder<T> {
    private _flags: VFormFlags = {
        validationStrategy: VValidationStrategy.Append,
        updateOnChange: false,
    }

    constructor(private _factory: VFormNodeFactory<T>) {
    }

    validationStrategy(strategy: VValidationStrategy): this {
        this._flags.validationStrategy = strategy;

        return this;
    }

    updateOnChange(): this {
        this._flags.updateOnChange = true;
        return this;
    }

    build<U extends T>(value: U): VForm<U> {
        return new VForm(
            this._factory,
            {
                ...this._flags,
            },
            value,
        );
    }
}

export function vForm<T>(factory: VFormNodeFactory<T>): VFormBuilder<T> {
    return new VFormBuilder(factory);
}

vForm.use = <T, TNode>(env: VFormEnvironment<TNode>): VEnvFormBuilderFactory<TNode> => {
    function vEnvForm<T>(factory: VEnvFormNodeFactory<T, TNode>): VFormBuilder<T> {
        return vForm(resolveEnvFactory(factory, env));
    }
    
    return vEnvForm;
};

function resolveEnvFactory<T, TNode>(factory: VEnvFormNodeFactory<T, TNode>, rootEnv: VFormEnvironment<TNode>): VFormNodeFactory<T> {
    return value => {
        const node = mapEnvNode(rootEnv, factory(value));

        if (!node) {
            throw new Error('Environment tree cannot be rendered into empty tree');
        }

        return node;
    };

    function mapEnvNode(env: VFormEnvironment<TNode>, node: TNode): Maybe<VFormNode> {
        const type = env.resolveType(node);
        if (type === VEnvFormNodeType.Options) {
            return mapEnvNode(env.fork(node), node);
        } else if (type === VEnvFormNodeType.Group) {
            const children = pickBy(mapValues(env.resolveGroupChildren(node), child => mapEnvNode(env, child)), Boolean);
            return env.resolveGroup(node, children as { [name: string]: VFormNode });
        } else if (type === VEnvFormNodeType.Array) {
            const children = env
                .resolveArrayChildren(node)
                .map(child => mapEnvNode(env, child))
                .filter(Boolean);
            return env.resolveArray(node, children as VFormNode[]);
        } else if (type === VEnvFormNodeType.Control) {
            return env.resolveControl(node);
        } else {
            return;
        }
    }
}
