import { Long, ObjectID } from "bson";
import { config } from "dotenv";
import { MongoClient, ServerApiVersion } from "mongodb";

config();

const client = new MongoClient(process.env.MONGO_URI || "", {
  //   useNewUrlParser: true,
  //   useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

type Server = {
  uid: Long;
  name: string;
  users: {
    id: ObjectID; // User
    nickname?: string;
    optedIn: boolean;
  }[];
  announcementsChannel: Long; // channel ID
  reminderPeriod: number; // duration in minutes
  commentPeriod: number; // duration in minutes
};
type Trade = {
  name: string;
  server: ObjectID; // Server
  users: ObjectID[]; // User[]
  trades: {
    from: ObjectID; // User
    to: ObjectID;
    song?: { song: string; comments?: string };
    response?: { rating: number; comments?: string };
  }[];
  start: Date;
  end: Date;
};
type User = {
  uid: Long;
  name: string;
  bio?: string;
  likedGenres?: string;
  dislikedGenres?: string;
  artists?: string;
  favoriteSongs?: string;
  newlyDiscovered?: string;
  favouriteSounds?: string;
  instruments?: string;
};

async function run() {
  try {
    await client.connect();

    const musicDB = client.db("musicbot");
    const servers = musicDB.collection<Server>("servers"),
      users = musicDB.collection<User>("users"),
      trades = musicDB.collection<Trade>("trades");
  } finally {
    await client.close();
  }
}

run().catch(console.dir);
