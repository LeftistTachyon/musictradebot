import { Long } from "mongodb";
import init, { close, deleteUser, fetchUser } from "./mongo";

async function run() {
  try {
    await init;

    const me = await fetchUser(new Long("518196574052941857"));
    console.dir(me);
    console.log("UID:", me?.uid.toString());

    const del = await deleteUser(new Long("518196574052941857"));
    console.dir(del);
  } finally {
    await close();
  }
}

run().catch(console.dir);
