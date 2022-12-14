import { config } from "dotenv";
import { Collection, Long, MongoClient, ServerApiVersion } from "mongodb";
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
 * @returns the server with the given UID
 * @throws InvalidServerError if an invalid (or unregistered) server UID is given
 */
async function getServer(uid: Long) {
  const output = await servers.findOne({ uid });
  if (!output)
    throw new InvalidServerError(`Server ${uid.toString()} not found!`);
  return output;
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
  const result = await servers.updateOne({ uid }, { $set: settings });
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
  const result = await servers.updateOne(
    { uid },
    { $set: { announcementsChannel } }
  );
  return result.acknowledged && result.modifiedCount == 1;
}

// no delete function, as that information will persist unless manually deleted by a bot maintainer

/**
 * An error that shows that a server was attempted to be found when it is not in the database
 */
class InvalidServerError extends Error {}

// ! SERVER-SPECIFIC USER CR[U]D !
/**
 * Adds a user to the list of users of the given server
 *
 * @param serverUID the UID of the server to add a user to
 * @param user the user to add
 * @returns whether the operation was successful
 */
export async function addServerUser(serverUID: Long, user: ServerUser) {
  const result = await servers.updateOne(
    { uid: serverUID },
    { $concatArrays: { users: [user] } }
  );
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
    { $set: { opt: optedIn } }
  );
  return result.acknowledged && result.modifiedCount == 1;
}

// ! CLEANUP FUNCTIONS !
/**
 * Closes the Mongo client.
 */
export async function close() {
  await client.close();
}
