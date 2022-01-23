# Integration

This library provides integration tests to check the library against different Angular and TS versions.

## Build

Run `npx ng build integration` to build the project. The build artifacts will be stored in the `dist/` directory.
Actually, this library does not compile anything, but copies code to the `dist/` directory using the corresponding Angular Builder from the `/tools/integration-builder` directory.
The copied tests are used AS IS in the integration environment.

## Running unit tests

Run `npx ng test integration` to execute the unit tests via [Karma](https://karma-runner.github.io).
