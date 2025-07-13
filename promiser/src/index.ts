type PromiseResolve<T> = (value: T | PromiseLike<T>) => void;
type PromiseReject = (reason?: any) => void;
type PromiseExecutor<T> = (resolve: PromiseResolve<T>, reject: PromiseReject) => void | PromiseLike<void>;
declare const $func: PromiseExecutor<unknown>;
export function createIIFE(func: Function) {
    return `(${func})()` as const;
}
export class AsyncWorker<T> {
    runnerCode: string | null = null;
    runnerUrl: string | null = null;
    internalWorker: Worker | null = null;
    promise: Promise<T>;
    constructor(executor: PromiseExecutor<T>) {
        let resolver: PromiseResolve<T>;
        let rejector: PromiseReject;
        this.promise = new Promise((resolve, reject) => {
            resolver = resolve;
            rejector = reject;
        });
        this.runnerCode = createIIFE(AsyncWorker.runnerTemplate).replaceAll("$func", executor.toString());
        this.runnerUrl = URL.createObjectURL(new Blob([this.runnerCode], { type: "text/javascript" }));
        this.internalWorker = new Worker(this.runnerUrl);
        this.internalWorker.addEventListener("message", (event) => {
            const { status, data, error } = event.data;
            if (status === "resolve") {
                this.reset();
                resolver(data);
            } else if (status === "reject") {
                this.reset();
                rejector(error);
            }
        });
    }
    reset() {
        if (!this.internalWorker) return;
        if (!this.runnerUrl) return;
        this.internalWorker.terminate();
        URL.revokeObjectURL(this.runnerUrl);
    }
    static runnerTemplate = () => {
        new Promise($func)
            .then((data) => self.postMessage({ status: "resolve", data }))
            .catch((error) => self.postMessage({ status: "reject", error }));
    };
}
export function asyncWork<T>(executor: PromiseExecutor<T>) {
    const controller = new AsyncWorker(executor);
    return Object.assign(controller.promise, { controller });
}