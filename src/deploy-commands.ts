import { REST, Routes } from "discord.js";
import { kill } from ".";
import { commandList } from "./commands";

// deploy le commmands

// validate environment
if (!process.env.DISCORD_TOKEN) throw new Error("Discord token missing");
if (!process.env.CLIENT_ID) throw new Error("Client ID missing");
if (Boolean(process.argv[4]) && !process.env.GUILD_ID)
  throw new Error("Guild ID missing for guild deploy");

// gather list of commands
const commands = commandList.map((command) => command.data.toJSON());

// create REST client
const rest = new REST().setToken(process.env.DISCORD_TOKEN);

// guild commands deploy case
(async () => {
  try {
    console.log(
      `Started refreshing ${commands.length} application (/) commands.`
    );

    await rest.put(
      Boolean(process.argv[4])
        ? Routes.applicationCommands(
            process.env.CLIENT_ID ?? "missing-client-id"
          )
        : Routes.applicationGuildCommands(
            process.env.CLIENT_ID ?? "missing-client-id",
            process.env.GUILD_ID ?? "missing-guild-id"
          ),
      { body: [] }
    );

    // The put method is used to fully refresh all commands in the guild with the current set
    const data = (await rest.put(
      Boolean(process.argv[4])
        ? Routes.applicationCommands(
            process.env.CLIENT_ID ?? "missing-client-id"
          )
        : Routes.applicationGuildCommands(
            process.env.CLIENT_ID ?? "missing-client-id",
            process.env.GUILD_ID ?? "missing-guild-id"
          ),
      { body: commands }
    )) as { length: number };

    console.log(
      `Successfully reloaded ${data.length} application (/) commands.`
    );
    // console.log(data);
  } catch (error) {
    // And of course, make sure you catch and log any errors!
    console.error(error);
  } finally {
    await kill();
  }
})();
