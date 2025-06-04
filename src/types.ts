import { Long } from "bson";
import {
  AutocompleteInteraction,
  ButtonInteraction,
  CacheType,
  ChatInputCommandInteraction,
  Guild,
  ModalSubmitInteraction,
  SharedSlashCommand,
} from "discord.js";

// ! =================== SCHEMA TYPES =================== !
/**
 * An object in the servers database
 */
export type Server = {
  uid: Long;
  name: string;
  users: ServerUser[];
  announcementsChannel?: Long; // channel UID
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
    response?: { rating: string; comments?: string };
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
  newArtists?: string;
  favoriteSounds?: string;
  instruments?: string;
};

/**
 * An object in the events database
 */
export type MusicEvent = {
  of: EventOf;
  baseline: Date; // the time to calculate the event from (e.g. 12 hours after this time, 2 hours before this time)
  time: Date; // the actual time of the event
  data: string; // any other data related to the event
};

/**
 * Descriptor of what this event is attached to
 */
export type EventOf = {
  server: Long; // the server where the trade is taking place
  trade: string; // name of the associated trade
  type: "reminder" | "phase1" | "phase2"; // what kind of event this is
};

/**
 * Transforms EventOf objects into selectors
 */
export type EventSelector = {
  [Property in keyof EventOf as `of.${Property}`]: EventOf[Property];
};

// ! ================== DISCORD TYPES =================== !
/**
 * Something that represents a slash command
 */
export type DiscordCommand = {
  data: SharedSlashCommand;
  execute: (
    interaction: ChatInputCommandInteraction<CacheType>
  ) => Promise<void>;
  autocomplete?: (
    interaction: AutocompleteInteraction<CacheType>
  ) => Promise<void>;
};

/**
 * Something that handles a button press
 */
export type ButtonHandler = {
  name: string;
  execute: (interaction: ButtonInteraction<CacheType>) => Promise<void>;
};

/**
 * Something that handles a form submission
 */
export type FormHandler = {
  name: string;
  execute: (interaction: ModalSubmitInteraction<CacheType>) => Promise<void>;
};

/**
 * Changes the type to something that has defined guild ID and object
 */
export type InServer<T> = T & { guildId: string; guild: Guild };

// // ! ================ OTHER UTILITY TYPES =============== !
