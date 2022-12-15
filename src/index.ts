import { Client, Events, GatewayIntentBits } from "discord.js";
import { DateTime } from "luxon";
import commands from "./commands";
import init, { close } from "./mongo";

const programStart = DateTime.now();

async function run() {
  await init;
  console.log(`Database connected in ${-programStart.diffNow().toMillis()} ms`);

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
    } else if (interaction.isButton()) {
      console.dir(interaction);
    }
  });

  client.once(Events.ClientReady, (c) => {
    console.log(
      `Ready! Logged in as ${c.user.tag} in ${-programStart
        .diffNow()
        .toMillis()} ms`
    );
  });

  client.on(Events.Invalidated, async () => {
    console.log("Closing Mongo connection...");
    await close();
  });

  client.login(process.env.DISCORD_TOKEN);
}

run().catch(console.dir);
