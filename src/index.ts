import { AsyncWorker } from "@asyncWorker/index";
console.log("start");
requestAnimationFrame(async () => {
    // await new Promise<void>((resolve) => {
    //     for (let i = 0; i < 9999999999; i++) { }
    //     resolve();
    // });
    await new AsyncWorker<void>((resolve) => {
        for (let i = 0; i < 9999999999; i++) { }
        resolve();
    }, {
        a: 1,
        b: 2
    });
    console.log("end");
});