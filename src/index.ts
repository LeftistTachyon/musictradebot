import { config } from "dotenv";
import { Long, MongoClient, ObjectId, ServerApiVersion } from "mongodb";
import { Server, Trade, User } from "./types";

config();

const client = new MongoClient(process.env.MONGO_URI || "missing-uri", {
  //   useNewUrlParser: true,
  //   useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    await client.connect();

    const musicDB = client.db("musicbot");
    const servers = musicDB.collection<Server>("servers"),
      users = musicDB.collection<User>("users"),
      trades = musicDB.collection<Trade>("trades");

    // users.insertOne({ uid: new Long("1"), name: "Jeffery" });
    await trades.insertOne({
      end: new Date(),
      name: "correct horse battery staple",
      server: new ObjectId("123456789ABCDEF012345678"),
      start: new Date(),
      trades: [],
      users: [],
    });
    await trades.createIndex({ name: 1 }, { unique: true });
  } finally {
    await client.close();
  }
}

run().catch(console.dir);
