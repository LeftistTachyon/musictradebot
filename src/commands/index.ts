import { Collection } from "discord.js";
import type { DiscordCommand } from "../types";
import aboutserver from "./aboutserver";
import exclude from "./exclude";
import opt from "./opt";
import ping from "./ping";
import profile from "./profile";
import sendmessage from "./sendmessage";
import setchannel from "./setchannel";
import setname from "./setname";
import setnickname from "./setnickname";
import setperiod from "./setperiod";
import setpingrole from "./setpingrole";
import stop from "./stop";
import trade from "./trade";

// ! Add any new commands into this list
export const commandList: DiscordCommand[] = [
  aboutserver,
  exclude,
  opt,
  ping,
  profile,
  sendmessage,
  setchannel,
  setname,
  setnickname,
  setperiod,
  setpingrole,
  stop,
  trade,
];

// Creating collection of commands
const output = new Collection<string, DiscordCommand>();
for (const command of commandList) {
  output.set(command.data.name, command);
}

export default output;
