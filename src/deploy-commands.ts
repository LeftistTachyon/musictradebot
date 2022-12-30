import { commandList } from "./commands";
import { REST, Routes } from "discord.js";
import { kill } from ".";

// deploy le commmands
// please don't hurt me, I couldn't think of a better way
if (Boolean(process.argv[4])) {
  // global commands deploy case
  (async () => {
    // validate environment
    if (!process.env.DISCORD_TOKEN) throw new Error("Discord token missing");
    if (!process.env.CLIENT_ID) throw new Error("Client ID missing");

    // gather list of commands
    const commands = commandList.map((command) => command.data.toJSON());

    // create REST client
    const rest = new REST({ version: "10" }).setToken(
      process.env.DISCORD_TOKEN
    );
    try {
      console.log(
        `Started refreshing ${commands.length} application (/) commands.`
      );

      const data = await rest.put(
        Routes.applicationCommands(process.env.CLIENT_ID),
        { body: commands }
      );

      console.log(
        `Successfully reloaded ${
          (data as { length: number }).length
        } application (/) commands.`
      );
    } catch (error) {
      console.dir(error);
    } finally {
      kill();
    }
  })();
} else {
  // guild commands deploy case
  (async () => {
    // validate environment
    if (!process.env.DISCORD_TOKEN) throw new Error("Discord token missing");
    if (!process.env.CLIENT_ID) throw new Error("Client ID missing");
    if (!process.env.GUILD_ID)
      throw new Error("Guild ID missing for guild deploy");

    // gather list of commands
    const commands = commandList.map((command) => command.data.toJSON());

    // create REST client
    const rest = new REST({ version: "10" }).setToken(
      process.env.DISCORD_TOKEN
    );
    try {
      console.log(
        `Started refreshing ${commands.length} application (/) commands.`
      );

      const data = await rest.put(
        Routes.applicationGuildCommands(
          process.env.CLIENT_ID,
          process.env.GUILD_ID
        ),
        { body: commands }
      );

      console.log(
        `Successfully reloaded ${
          (data as { length: number }).length
        } application (/) commands.`
      );
    } catch (error) {
      console.dir(error);
    } finally {
      kill();
    }
  })();
}
