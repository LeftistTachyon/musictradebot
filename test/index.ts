import { DateTime } from "luxon";
import {
  addEvents,
  getCache,
  loadCache,
  saveCache,
  scheduleFromCache,
} from "../src/event-cache";
import mongo, { close } from "../src/mongo";

(async () => {
  // process.stdout.write("adding events... ");
  // addEvents([
  //   {
  //     event: "graceful-fierce-quill",
  //     time: DateTime.now().plus({ seconds: 12 }).toMillis(),
  //     type: "end1",
  //   },
  // ]);
  // console.log("done!");

  // process.stdout.write("saving cache... ");
  // await saveCache();
  // console.log("done!");

  process.stdout.write("loading cache... ");
  await loadCache();
  console.log("done!");

  console.log(getCache());

  process.stdout.write("waiting for mongo... ");
  await mongo;
  console.log("done!");

  process.stdout.write("scheduling events (expect error)... ");
  await scheduleFromCache(null as any);
  console.log("done!");

  await close();
  // process.kill(0);
})();
