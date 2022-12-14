import { Long, ObjectID } from "bson";
import { config } from "dotenv";
import { MongoClient, ServerApiVersion } from "mongodb";

config();

const client = new MongoClient(process.env.MONGO_URI || "", {
  //   useNewUrlParser: true,
  //   useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    await client.connect();

    const musicbot = client.db("musicbot");
    const servers = musicbot.collection("servers"),
      users = musicbot.collection("users");

    const result1 = await servers.insertOne({
      uid: new Long("521073512568586241"),
      name: "Glowing Guacamole",
    });
    console.dir(result1);

    const result2 = await users.insertMany([
      {
        uid: new Long("935723523819839489"),
        name: "時雨",
        tag: "時雨#0941",
      },
      {
        uid: new Long("518196574052941857"),
        name: "LeftistTachyon",
        tag: "LeftistTachyon#0279",
      },
    ]);
    console.dir(result2);

    const result3 = await Promise.all([
      servers.createIndex({ uid: 1 }, { unique: true }),
      users.createIndex({ uid: 1 }, { unique: true }),
    ]);
    console.log("Successfully parallelized operation:");
    console.dir(result3);
  } finally {
    await client.close();
  }
}

run().catch(console.dir);
