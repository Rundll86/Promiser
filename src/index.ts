import { promiser } from "@promiser/index";
console.log("start");
await promiser<void>((resolve) => {
    for (let i = 0; i < 10000000000; i++) { }
    resolve();
});
console.log("end");