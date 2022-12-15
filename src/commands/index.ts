import { Collection } from "discord.js";
import { DiscordCommand } from "../types";
import optin from "./optin";
import optout from "./optout";
import ping from "./ping";
import profile from "./profile";
import setchannel from "./setchannel";
import setname from "./setname";
import setnickname from "./setnickname";
import setperiod from "./setperiod";
import trade from "./trade";

// ! Add any new commands into this list
export const commandList: DiscordCommand[] = [
  optin,
  optout,
  ping,
  profile,
  setchannel,
  setname,
  setnickname,
  setperiod,
  trade,
];

// Creating collection of commands
const output = new Collection<string, DiscordCommand>();
for (const command of commandList) {
  output.set(command.data.name, command);
}

export default output;
