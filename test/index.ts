import { setTimeout } from "timers/promises";

// test
console.log("begin test");
setTimeout(1_000, { hello: "world" }).then(console.log);
