import { Long } from "bson";

// ! =================== SCHEMA TYPES =================== !
/**
 * An object in the servers database
 */
export type Server = {
  uid: Long;
  name: string;
  users: ServerUser[];
  trades: string[]; // trade names
  announcementsChannel: Long; // channel UID
  reminderPeriod: number; // duration in minutes
  commentPeriod: number; // duration in minutes
  pingableRole?: Long; // role UID
};

/**
 * An object that is contained within Server that represents a single user in a server
 */
export type ServerUser = {
  uid: Long; // User UID
  nickname?: string;
  optedIn: boolean;
};

/**
 * An object in the trades database
 */
export type Trade = {
  name: string;
  server: Long; // Server UID
  users: Long[]; // User UID[]
  trades: {
    from: Long; // User UID
    to: Long;
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
