type PromiseResolve<T> = (value: T | PromiseLike<T>) => void;
type PromiseReject = (reason?: any) => void;
type PromiseExecutor<T> = (resolve: PromiseResolve<T>, reject: PromiseReject) => void | PromiseLike<void>;
declare const $context: string;
export function createIIFE(func: Function) {
    return `(${func})()` as const;
}
export class AsyncWorkerController<T> {
    runnerCode: string | null = null;
    runnerUrl: string | null = null;
    internalWorker: Worker | null = null;
    promise: Promise<T>;
    constructor(executor: PromiseExecutor<T>, workerContext?: Record<string, any>) {
        let contextString = "";
        if (workerContext) {
            try {
                JSON.stringify(workerContext);
            } catch {
                throw new Error("WorkerContext must be serializable.");
            }
            contextString += Object.keys(workerContext).map(key => `${key}=${workerContext[key]};`).join("\n");
        }
        let resolver: PromiseResolve<T>;
        let rejector: PromiseReject;
        this.promise = new Promise((resolve, reject) => {
            resolver = resolve;
            rejector = reject;
        });
        this.runnerUrl = URL.createObjectURL(
            new Blob(
                [createIIFE(AsyncWorkerController.runnerTemplate).replaceAll("$context", contextString)],
                { type: "text/javascript" }
            )
        );
        this.internalWorker = new Worker(this.runnerUrl);
        this.internalWorker.postMessage({ executor });
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
        self.addEventListener("message", (event) => {
            $context
            new Promise(event.data.executor)
                .then((data) => self.postMessage({ status: "resolve", data }))
                .catch((error) => self.postMessage({ status: "reject", error }));
        });
    };
}
export class AsyncWorker<T> extends Promise<T> {
    controller: AsyncWorkerController<T>;
    constructor(executor: PromiseExecutor<T>, workerContext?: Record<string, any>) {
        super(async (resolve, reject) => {
            try {
                const data = await this.controller.promise;
                resolve(data);
            } catch (error) {
                reject(error);
            }
        });
        this.controller = new AsyncWorkerController(executor, workerContext);
    }
}
export function asyncWorker<T>(executor: PromiseExecutor<T>, workerContext?: Record<string, any>) {
    const controller = new AsyncWorkerController(executor, workerContext);
    return Object.assign(controller.promise, { controller });
}