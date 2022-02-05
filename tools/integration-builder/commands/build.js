const { defer, NEVER } = require('rxjs');
const { ncp } = require('ncp');
const fs = require('fs');
const { promisify } = require('util');
const chokidar = require('chokidar');

const mkdir = promisify(fs.mkdir);
const del = promisify(fs.rmdir);
const copy = promisify(ncp);

class IntegrationBuilder {
    constructor(context) {
        this.context = context;
        this.buildInProgress = false;
        this.pendingTask = null;
    }
    run({ options }) {
        if (options.watch) {
            return defer(() => {
                chokidar.watch(options.src).on('all', () => this.schedule(options));
                return NEVER;
            });
        }
        return defer(() => this.rebuild(options));
    }
    schedule(options) {
        const startTask = () => {
            console.log('Started to rebuild');
        };
        const finishTask = (error) => {
            if (error) {
                console.error('Rebuild was failed', error);
            } else {
                console.log('Rebuild has finished');
            }
            const pendingTask = this.pendingTask;
            if (pendingTask) {
                this.pendingTask = null;
                return pendingTask();
            }
        };

        const task = () => {
            startTask();
            return this.rebuild(options).then(() => finishTask(), finishTask);
        };

        if (this.buildInProgress) {
            this.pendingTask = task;
        } else {
            task();
        }
    }
    rebuild(options) {
        this.buildInProgress = true;
        return mkdir(options.dest, { recursive: true })
            .then(() => del(options.dest, { recursive: true, force: true }))
            .then(() => copy(options.src, options.dest))
            .then(() => ({ success: true }))
            .finally(() => {
                this.buildInProgress = false;
            });
    }
}

exports.IntegrationBuilder = IntegrationBuilder;
exports.default = IntegrationBuilder;