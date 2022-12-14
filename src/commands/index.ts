import { Collection } from "discord.js";
import { DiscordCommand } from "../types";
import ping from "./ping";

// ! Add any new commands into this list
export const commandList: DiscordCommand[] = [ping];

// Creating collection of commands
const output = new Collection<string, DiscordCommand>();
for (const command of commandList) {
  output.set(command.data.name, command);
}

export default output;
