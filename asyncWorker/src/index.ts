type PromiseResolve<T> = (value: T | PromiseLike<T>) => void;
type PromiseReject<E> = (reason?: E) => void;
type PromiseExecutor<T, E> = (resolve: PromiseResolve<T>, reject: PromiseReject<E>) => void | PromiseLike<void>;
declare const $context: string;
declare const $executor: PromiseExecutor<any, any>;
export function createIIFE(func: Function) {
    return `(${func})()` as const;
}
export class AsyncWorkerController<T, E> {
    runnerCode: string | null = null;
    runnerUrl: string | null = null;
    internalWorker: Worker | null = null;
    promise: Promise<T>;
    constructor(executor: PromiseExecutor<T, E>, context?: Record<string, any>) {
        let contextString = "";
        if (context) {
            try {
                JSON.stringify(context);
            } catch {
                throw new Error("WorkerContext must be serializable.");
            }
            contextString += Object.keys(context).map(key => `${key}=${context[key]}`).join(";\n");
        }
        let resolver: PromiseResolve<T>;
        let rejector: PromiseReject<E>;
        this.promise = new Promise((resolve, reject) => {
            resolver = resolve;
            rejector = reject;
        });
        this.runnerUrl = URL.createObjectURL(
            new Blob(
                [
                    createIIFE(AsyncWorkerController.runnerTemplate)
                        .replaceAll("$context", contextString)
                        .replaceAll("$executor", executor.toString())
                ],
                { type: "text/javascript" }
            )
        );
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
        self.addEventListener("message", () => {
            $context;
            new Promise($executor)
                .then((data) => self.postMessage({ status: "resolve", data }))
                .catch((error) => self.postMessage({ status: "reject", error }));
        });
    };
}
export function asyncWorker<T = any, E = any>(executor: PromiseExecutor<T, E>, context?: Record<string, any>) {
    const controller = new AsyncWorkerController(executor, context);
    return Object.assign(controller.promise, { controller });
}