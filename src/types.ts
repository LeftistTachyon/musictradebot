import { Long, ObjectID } from "bson";

// ! SCHEMA TYPES !
/**
 * An object in the servers database
 */
export type Server = {
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

/**
 * An object in the trades database
 */
export type Trade = {
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

/**
 * An object in the users database
 */
export type User = {
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
