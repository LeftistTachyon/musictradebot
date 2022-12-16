import { Client, Events, GatewayIntentBits } from "discord.js";
import { DateTime } from "luxon";
import commands from "./commands";
import buttons from "./buttons";
import forms from "./forms";
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
      const buttonHandler = buttons.get(interaction.customId);

      if (!buttonHandler) {
        console.error(`No button matching ${interaction.customId} was found.`);
        return;
      }

      try {
        await buttonHandler.execute(interaction);
      } catch (error) {
        console.error(error);
        await interaction.reply({
          content: "There was an error while executing this button press!",
          ephemeral: true,
        });
      }
    } else if (interaction.isModalSubmit()) {
      const formHandler = forms.get(interaction.customId);

      if (!formHandler) {
        console.error(`No form matching ${interaction.customId} was found.`);
        return;
      }

      try {
        await formHandler.execute(interaction);
      } catch (error) {
        await interaction.reply({
          content: "There was an error while submitting this form!",
          ephemeral: true,
        });
      }
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
