import { Long } from "mongodb";
import init, {
  addServer,
  addServerUser,
  close,
  deleteUser,
  fetchUser,
  setOpt,
} from "./mongo";
import { Server, ServerUser } from "./types";

async function run() {
  try {
    await init;

    // const server: Server = {
    //   uid: new Long("521073512568586241"),
    //   name: "Glowing Guacamole",
    //   users: [],
    //   announcementsChannel: new Long("861805901434454018"),
    //   reminderPeriod: 24 * 60,
    //   commentPeriod: 48 * 60,
    // };
    // console.log(await addServer(server));

    // const serverUser: ServerUser = {
    //   uid: new Long("518196574052941857"),
    //   optedIn: false,
    // };
    // console.log(
    //   await addServerUser(new Long("521073512568586241"), serverUser)
    // );

    // await setOpt(
    //   new Long("521073512568586241"),
    //   new Long("518196574052941857"),
    //   true
    // );
  } finally {
    await close();
  }
}

run().catch(console.dir);
