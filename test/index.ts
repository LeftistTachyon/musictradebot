import { DateTime } from "luxon";

console.log(DateTime.now().minus({ minutes: 1 }).diffNow().toMillis());
