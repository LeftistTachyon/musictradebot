import { DateTime } from "luxon";

const now = DateTime.now(),
  after = now.plus({ hours: 1 });

console.log(now > after, after > now);
