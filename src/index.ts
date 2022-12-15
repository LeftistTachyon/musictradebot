import { Client, Events, GatewayIntentBits } from "discord.js";
import { Long } from "mongodb";
import commands from "./commands";
import init, { addServer, close, upsertUser } from "./mongo";

async function run() {
  await init;

  // upsertUser({
  //   uid: new Long("518196574052941857"),
  //   name: "LeftistTachyon",
  // });

  const client: Client = new Client({ intents: [GatewayIntentBits.Guilds] });

  client.on(Events.InteractionCreate, async (interaction) => {
    if (interaction.isChatInputCommand()) {
      const command = commands.get(interaction.commandName);

      if (!command) {
        console.error(
          `No command matching ${interaction.commandName} was found.`
        );
        return;
      }

      try {
        await command.execute(interaction);
      } catch (error) {
        console.error(error);
        await interaction.reply({
          content: "There was an error while executing this command!",
          ephemeral: true,
        });
      }
    }
  });

  client.once(Events.ClientReady, (c) => {
    console.log(`Ready! Logged in as ${c.user.tag}`);
  });

  client.on(Events.Invalidated, async () => {
    console.log("Closing Mongo connection...");
    await close();
  });

  client.login(process.env.DISCORD_TOKEN);
}

run().catch(console.dir);
