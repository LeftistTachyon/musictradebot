import { config } from "dotenv";
import {
  Collection,
  Long,
  MongoClient,
  ObjectId,
  ServerApiVersion,
} from "mongodb";
import { format } from "path";
import { Server, ServerUser, Trade, User } from "./types";

// ! INITIALIZATION ROUTINE !
config();

const client = new MongoClient(process.env.MONGO_URI || "missing-uri", {
  //   useNewUrlParser: true,
  //   useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

let servers: Collection<Server>,
  users: Collection<User>,
  trades: Collection<Trade>;

/**
 * A Promise that returns when the Mongo client is fully initialized
 */
export default (async () => {
  await client.connect();

  const musicDB = client.db("musicbot");

  servers = musicDB.collection<Server>("servers");
  users = musicDB.collection<User>("users");
  trades = musicDB.collection<Trade>("trades");
})();

// ! USER CRUD !
/**
 * Updates or, if it cannot find a match, inserts the given user into the database
 *
 * @param user the User object to update or insert into the database
 * @returns whether the operation was successful
 */
export async function upsertUser(user: User) {
  const result = await users.updateOne({ uid: user.uid }, user, {
    upsert: true,
  });
  return (
    result.acknowledged &&
    (result.modifiedCount == 1 || result.upsertedCount == 1)
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
  const result = await users.updateOne({ uid }, { name });
  return result.acknowledged && result.modifiedCount == 1;
}

/**
 * Deletes the user profile of the specifies user completely
 *
 * @param uid the UID of the user to fetch
 * @returns whether the operation was successful or not
 */
export async function deleteUser(uid: Long) {
  const result = await users.deleteOne({ uid });
  return result.acknowledged && result.deletedCount == 1;
}

// ! SERVER [CRU]D !
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
 * Updates the name for the given server.
 *
 * @param uid the UID of the server to update
 * @param name the new name for the server
 * @returns whether the operation was successful
 */
export async function updateServerName(uid: Long, name: string) {
  const result = await servers.updateOne({ uid }, { name });
  return result.acknowledged && result.modifiedCount == 1;
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
  const result = await servers.updateOne({ uid }, [{ $set: settings }]);
  return result.acknowledged && result.modifiedCount == 1;
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
  const result = await servers.updateOne({ uid }, [
    { $set: { announcementsChannel } },
  ]);

  return result.acknowledged && result.modifiedCount == 1;
}

/**
 * Updates the pingable role for the given server.
 *
 * @param uid the UID of the server to update
 * @param pingableRole the new pingable role for the server
 * @returns whether the operation was successful
 */
export async function updateServerPingableRole(uid: Long, pingableRole: Long) {
  const result = await servers.updateOne({ uid }, [{ $set: { pingableRole } }]);
  return result.acknowledged && result.modifiedCount == 1;
}

// no delete function, as that information will persist unless manually deleted by a bot maintainer

// ! SERVER-SPECIFIC USER CR[U]D !
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

  return result.acknowledged && result.modifiedCount == 1;
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
    [{ $set: { users: { optedIn } } }]
  );

  return result.acknowledged && result.modifiedCount == 1;
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
    [
      {
        $set: {
          users: {
            nickname: nickname.toLowerCase() == "none" ? undefined : nickname,
          },
        },
      },
    ]
  );

  return result.acknowledged && result.modifiedCount == 1;
}

// ! TRADE [CRU]D !
/**
 * Inserts the given trade into the trades database
 *
 * @param trade the trade to insert into the database
 * @returns the inserted trade's ID, if successful. If not, null.
 */
export async function createTrade(trade: Trade) {
  const result = await trades.insertOne(trade);
  return result.acknowledged ? result.insertedId : null;
}

/**
 * Finds a trade with the given name and returns it
 *
 * @param name the name of the trade to find
 * @returns the trade with the given name, if found
 */
export async function fetchTradeByName(name: string) {
  return await trades.findOne({ name });
}

/**
 * Finds a trade with the given object ID and returns it
 *
 * @param id the object ID of the trade to find
 * @returns the trade with the given ID, if found
 */
export async function fetchTrade(id: ObjectId) {
  return await trades.findOne({ _id: id });
}

/**
 * Sets the directed graph of trades for the given trade object.
 * Each user must have one edge coming out and one edge coming in.
 *
 * @param id the ID of the trade to change
 * @param graph the [from, to] pairs of user UIDs to set as the directed graph of trades. Each from must be necessarily unique, and same with to.
 * @returns whether teh operation was successful
 */
export async function setTradeGraph(id: ObjectId, graph: [Long, Long][]) {
  const result = await trades.updateOne({ _id: id }, [
    {
      $set: {
        trades: graph.map(([from, to]) => ({
          from,
          to,
        })),
      },
    },
  ]);

  return result.acknowledged && result.modifiedCount == 1;
}

/**
 * Sets a new end date for the trade.
 *
 * @param id the ID of the trade to change
 * @param date the new ending date to set for the trade
 * @returns whether the operation was successful
 */
export async function setTradeEndDate(id: ObjectId, date: Date) {
  const result = await trades.updateOne({ _id: id }, [{ $set: { date } }]);
  return result.acknowledged && result.modifiedCount == 1;
}

/**
 * Sets the song + optional comments sent for a certain two-person trade, characterized by a JS object.
 * The two-person trade (or an edge in the trade graph) is characterized by the ID of the trade
 * and the UID of the user sending the song
 *
 * @param tradeID the ID of the trade to add comments to
 * @param fromUID the person sending the song (song "from")
 * @param song the song + optional comments that the user sent in
 * @returns whether the operation was successful
 */
export async function setTradeSong(
  tradeID: ObjectId,
  fromUID: Long,
  song: { song: string; comments?: string }
) {
  const result = await trades.updateOne(
    { _id: tradeID, "trades.from": fromUID },
    [{ $set: { trades: { song } } }]
  );

  return result.acknowledged && result.modifiedCount == 1;
}

/**
 * Sets the rating + optional comments for a certain two-person trade, characterized by a JS object.
 * The two-person trade (or an edge in the trade graph) is characterized by the ID of the trade
 * and the UID of the user recieving the song
 *
 * @param tradeID the ID of the trade to add a response to
 * @param toUID the person sending back the comments (song "to")
 * @param response the rating + optional comments that the user responded with
 * @returns whether the operation was successful
 */
export async function setTradeResponse(
  tradeID: ObjectId,
  toUID: Long,
  response: { rating: number; comments?: string }
) {
  const result = await trades.updateOne({ _id: tradeID, "trades.to": toUID }, [
    { $set: { trades: { response } } },
  ]);

  return result.acknowledged && result.modifiedCount == 1;
}

// no delete, as these will be retained perpetually

// ! CLEANUP FUNCTIONS !
/**
 * Closes the Mongo client.
 */
export async function close() {
  await client.close();
}