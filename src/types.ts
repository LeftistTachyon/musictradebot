import { Long, ObjectID } from "bson";

// Schema types
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
