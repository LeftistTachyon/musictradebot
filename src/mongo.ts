import { Long } from "bson";
import { Collection, MongoClient } from "mongodb";
import type { Server, ServerUser, Trade, User } from "./types";

// ! ============== INITIALIZATION ROUTINE ============== !
const mongoURI = process.env.MONGO_URI || "missing-mongo-uri";
// console.log(`Connecting to URI ${mongoURI}...`);
const client = new MongoClient(mongoURI);

let servers: Collection<Server>,
  users: Collection<User>,
  trades: Collection<Trade>;

let isOpen = false;

/**
 * A Promise that returns when the Mongo client is fully initialized
 */
export default (async () => {
  console.log("Connecting to music bot DB...");
  await client.connect();
  isOpen = true;

  const musicDB = client.db("musicbot");

  servers = musicDB.collection<Server>("servers");
  users = musicDB.collection<User>("users");
  trades = musicDB.collection<Trade>("trades");
})();

// ! ======================= PING ======================= !
/**
 * Pings the database.
 *
 * @returns the response to the ping
 */
export async function pingDB() {
  return await client.db("admin").command({ ping: 1 });
}

// ! ==================== USER CRUD ===================== !
/**
 * Updates or, if it cannot find a match, inserts the given user into the database
 *
 * @param user the User object to update or insert into the database
 * @returns whether the operation was successful
 */
export async function upsertUser(user: Partial<User>) {
  const result = await users.updateOne(
    { uid: user.uid },
    { $set: user },
    {
      upsert: true,
    }
  );
  return (
    result.acknowledged &&
    (result.matchedCount === 1 || result.upsertedCount === 1)
  );
}

/**
 * Fetches the user profile of the specified user
 *
 * @param uid the UID of the user to fetch
 * @returns the found User, if any exists (null is returned if none is found)
 */
export async function fetchUser(uid: Long) {
  return await users.findOne({ uid });
}

/**
 * Changes the name of the given user to the given string
 *
 * @param uid the UID of the user to update
 * @param name the new name that the user should have
 * @returns wehther the operation was successful
 */
export async function setUserName(uid: Long, name: string) {
  const result = await users.updateOne({ uid }, { $set: { name } });
  return result.acknowledged && result.matchedCount === 1;
}

/**
 * Deletes the user profile of the specifies user completely
 *
 * @param uid the UID of the user to fetch
 * @returns whether the operation was successful or not
 */
export async function deleteUser(uid: Long) {
  const result1 = await users.deleteOne({ uid });
  const result2 = await servers.updateMany(
    { "users.uid": uid },
    { $pull: { "users.uid": uid } }
  );

  return (
    result1.acknowledged &&
    result1.deletedCount === 1 &&
    result2.acknowledged &&
    result2.matchedCount === result2.modifiedCount
  );
}

// ! ================== SERVER [CRU]D =================== !
/**
 * Adds a new server into the database
 *
 * @param server the new server object to add to the database
 * @returns the ID of the inserted server, or null (if not successful)
 */
export async function addServer(server: Server) {
  const result = await servers.insertOne(server);
  return result.acknowledged ? result.insertedId : null;
}
/**
 * Finds the server with the given UID and returns it.
 *
 * @param uid the UID of the server to fetch
 * @returns the server with the given UID, if it exists. Otherwise, null.
 */
export async function getServer(uid: Long) {
  return await servers.findOne({ uid });
}

/**
 * Finds the server-user profile from the given server and user and returns it.
 *
 * @param serverUID the UID of the server to find the user in
 * @param userUID the UID of the user to find in the given server
 * @returns the server-user profile, if it exsists. Otherwise, null.
 */
export async function fetchServerUser(serverUID: Long, userUID: Long) {
  const server = await servers.findOne({
    uid: serverUID,
    users: { $elemMatch: { uid: userUID } },
  });

  return server?.users[0];
}

/**
 * Deletes the given server's user profile.
 *
 * @param serverUID the UID of the server to delete the user from
 * @param userUID the UID of the user to remove
 * @returns whether the operation was successful
 */
export async function deleteServerUser(serverUID: Long, userUID: Long) {
  const result = await servers.updateOne(
    {
      uid: serverUID,
    },
    { $pull: { "users.uid": userUID } }
  );

  return result.acknowledged && result.matchedCount == 1;
}

/**
 * Updates the name for the given server.
 *
 * @param uid the UID of the server to update
 * @param name the new name for the server
 * @returns whether the operation was successful
 */
export async function updateServerName(uid: Long, name: string) {
  const result = await servers.updateOne({ uid }, { $set: { name } });
  return result.acknowledged && result.matchedCount === 1;
}

/**
 * Updates various settings of the given server. Omitted settings will not be altered
 *
 * @param uid the UID of the server to update
 * @param name the new settings for the server
 * @returns whether the operation was successful
 */
export async function updateServerSettings(
  uid: Long,
  settings: {
    reminderPeriod?: number;
    commentPeriod?: number;
  }
) {
  const result = await servers.updateOne({ uid }, { $set: settings });
  return result.acknowledged && result.matchedCount === 1;
}

/**
 * Updates the annoucements channel for the given server, given its UID.
 *
 * @param uid the UID of the server to update
 * @param announcementsChannel the new annoucements channel for the server
 * @returns whether the operation was successful
 */
export async function updateServerAnnounceCh(
  uid: Long,
  announcementsChannel: Long
) {
  const result = await servers.updateOne(
    { uid },
    { $set: { announcementsChannel } }
  );

  return result.acknowledged && result.matchedCount === 1;
}

/**
 * Updates the pingable role for the given server.
 *
 * @param uid the UID of the server to update
 * @param pingableRole the new pingable role for the server
 * @returns whether the operation was successful
 */
export async function updateServerPingableRole(uid: Long, pingableRole: Long) {
  const result = await servers.updateOne({ uid }, { $set: { pingableRole } });
  return result.acknowledged && result.matchedCount === 1;
}

// no delete function, as that information will persist unless manually deleted by a bot maintainer

/**
 * Removes the pingable role for the given server.
 *
 * @param uid the UID the server to update
 * @returns whether the operation was successful
 */
export async function removeServerPingableRole(uid: Long) {
  const result = await servers.updateOne({ uid }, [{ $unset: "pingableRole" }]);

  return result.acknowledged && result.matchedCount === 1;
}

// ! =========== SERVER-SPECIFIC USER CR[U]D ============ !
/**
 * Adds a user to the list of users of the given server
 *
 * @param serverUID the UID of the server to add a user to
 * @param user the user to add
 * @returns whether the operation was successful
 */
export async function addServerUser(serverUID: Long, user: ServerUser) {
  const result = await servers.updateOne({ uid: serverUID }, [
    { $set: { users: { $concatArrays: ["$users", [user]] } } },
  ]);

  return result.acknowledged && result.matchedCount === 1;
}

/**
 * Sets the given user's option to opt-in or opt-out in the given server, if possible.
 *
 * @param serverUID the UID of the server to adjust the settings in
 * @param userUID the UID of the user to adjust the settings of
 * @param optedIn the new opt-in or opt-out setting to set the value as
 * @returns whether the operation was successful
 */
export async function setOpt(serverUID: Long, userUID: Long, optedIn: boolean) {
  const result = await servers.updateOne(
    { uid: serverUID, "users.uid": userUID },
    { $set: { "users.$.optedIn": optedIn } }
  );

  return result.acknowledged && result.matchedCount === 1;
}

/**
 * Changes the given user's nickname in the given server, if possible.
 *
 * @param serverUID the UID of the server to change the nickname in
 * @param userUID the UID of the user to change the nickname of
 * @param nickname the new nickname for the user
 * @returns whether the operation was successful
 */
export async function setNickname(
  serverUID: Long,
  userUID: Long,
  nickname: string
) {
  const result = await servers.updateOne(
    { uid: serverUID, "users.uid": userUID },
    {
      $set: {
        "users.$.nickname":
          nickname.toLowerCase() === "none" ? undefined : nickname,
      },
    }
  );

  return result.acknowledged && result.matchedCount === 1;
}

// ! =================== TRADE [CRU]D =================== !
/**
 * Inserts the given trade into the trades database.
 * Also links to the given server. If no server exists, this will fail silently.
 *
 * @param trade the trade to insert into the database
 * @returns the inserted trade's ID, if successful. If not, null.
 */
export async function addTrade(trade: Trade) {
  const result = await trades.insertOne(trade);
  return result.acknowledged ? result.insertedId : null;
}

/**
 * Finds a trade with the given name and returns it
 *
 * @param name the name of the trade to find
 * @returns the trade with the given name, if found
 */
export async function fetchTrade(name: string) {
  return await trades.findOne({ name });
}

/**
 * Finds all trades that are associated with the given server
 *
 * @param server the server to find all trade names for
 * @returns all names of trades in the given server
 */
export async function fetchTradeNames(server: Long) {
  return await trades
    .find({ server, end: { $gt: new Date() } })
    .map((trade) => trade.name)
    .toArray();
}

/**
 * Sets the directed graph of trades for the given trade object.
 * Each user must have one edge coming out and one edge coming in.
 *
 * @param name the name of the trade to change
 * @param graph the [from, to] pairs of user UIDs to set as the directed graph of trades. Each from must be necessarily unique, and same with to.
 * @returns whether the operation was successful
 */
export async function setTradeGraph(name: string, graph: [Long, Long][]) {
  const result = await trades.updateOne({ name }, [
    {
      $set: {
        trades: graph.map(([from, to]) => ({
          from,
          to,
        })),
      },
    },
  ]);

  return result.acknowledged && result.matchedCount === 1;
}

/**
 * Sets a new end date for the trade.
 *
 * @param name the name of the trade to change
 * @param date the new ending date to set for the trade
 * @returns whether the operation was successful
 */
export async function setTradeEndDate(name: string, date: Date) {
  const result = await trades.updateOne({ name }, { $set: { date } });
  return result.acknowledged && result.matchedCount === 1;
}

/**
 * Sets the song + optional comments sent for a certain two-person trade, characterized by a JS object.
 * The two-person trade (or an edge in the trade graph) is characterized by the name of the trade
 * and the UID of the user sending the song
 *
 * @param tradeName the name of the trade to add comments to
 * @param fromUID the person sending the song (song "from")
 * @param song the song + optional comments that the user sent in
 * @returns whether the operation was successful
 */
export async function setTradeSong(
  tradeName: string,
  fromUID: Long,
  song: { song: string; comments?: string }
) {
  const result = await trades.updateOne(
    { name: tradeName, "trades.from": fromUID },
    { $set: { "trades.$.song": song } }
  );

  return result.acknowledged && result.matchedCount === 1;
}

/**
 * Sets the rating + optional comments for a certain two-person trade, characterized by a JS object.
 * The two-person trade (or an edge in the trade graph) is characterized by the name of the trade
 * and the UID of the user recieving the song
 *
 * @param tradeName the name of the trade to add a response to
 * @param toUID the person sending back the comments (song "to")
 * @param response the rating + optional comments that the user responded with
 * @returns whether the operation was successful
 */
export async function setTradeResponse(
  tradeName: string,
  toUID: Long,
  response: { rating: string; comments?: string }
) {
  const result = await trades.updateOne(
    { name: tradeName, "trades.to": toUID },
    { $set: { "trades.$.response": response } }
  );

  return result.acknowledged && result.matchedCount === 1;
}

// no delete, as these will be retained perpetually

// ! =================== EVENTS CRUD ==================== !

/**
 * Determines which phase the given trade is in. If the trade doesn't exist, it will return "done".
 *
 * @param tradeName the name of the trade to fetch the stage for
 * @returns which phase the trade is in
 */
export async function getStage(
  tradeName: string
): Promise<"phase1" | "phase2" | "done"> {
  // const length = (await fetchEvents({ trade: tradeName })).length;
  const length = 1;

  if (!length) return "done";
  if (length <= 2) return "phase2";
  else return "phase1";
}

// ! ================ CLEANUP FUNCTIONS ================= !
/**
 * Closes the Mongo client.
 */
export async function close() {
  if (isOpen) {
    await client.close();
    isOpen = false;
  }
}
