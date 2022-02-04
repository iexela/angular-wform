# Roadmap

1. Types
    1. Think about better typing
    1. compose(...) and composeAsync(...) cannot take nils
1. Ivy
    1. Create ivy version of the library
1. Reconcilation
    1. Implement tests for controls to test changing of wnode types
    1. Think how to simplify patch implementation (patch as wnode transformation)
    1. Is it a good idea to schedule dataChanges immediately
1. Validators
    1. Should we allow to customzie `required` validator for strings?
    1. Think how emulate constant errors using custom validator
1. Clean code
    1. Log console.debug/console.warn only in dev mode?
    1. Prettify code
1. Support CI
    1. Publish through CI
    1. Try to get rid of `git fetch --unshallow`
1. Write documentation
    1. Use github pages?
1. Examples
    1. Add character builder based on portals
    1. Use stackblitz for examples?
1. Publishing
    1. Add tags