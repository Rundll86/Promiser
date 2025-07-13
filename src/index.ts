import { asyncWork } from "@promiser/index";
console.log("start");
requestAnimationFrame(() => {
    new Promise<void>((resolve) => {
        for (let i = 0; i < 9999999999; i++) { }
        resolve();
    })
        // promiser<void>((resolve) => {
        //     for (let i = 0; i < 9999999999; i++) { }
        //     resolve();
        // })
        .then(() => {
            console.log("end");
        });
});