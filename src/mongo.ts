import { config } from "dotenv";
import { Collection, Long, MongoClient, ServerApiVersion } from "mongodb";
import { Server, Trade, User } from "./types";

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

// ! CLEANUP FUNCTIONS !
/**
 * Closes the Mongo client.
 */
export async function close() {
  await client.close();
}
