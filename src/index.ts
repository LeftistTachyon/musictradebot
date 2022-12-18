import { Long } from "bson";
import { Client, Events, GatewayIntentBits } from "discord.js";
import { DateTime } from "luxon";
import buttons from "./buttons";
import commands from "./commands";
import forms from "./forms";
import init, { addServer, close, getServer, updateServerName } from "./mongo";
import { Server } from "./types";
import { getDefaultTimeframes } from "./util";

const programStart = DateTime.now();

export const client: Client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

async function run() {
  await init;
  console.log(`Database connected in ${-programStart.diffNow().toMillis()} ms`);

  // console.log("Guilds currently installed:");
  // client.guilds.cache.forEach((guild, snowflake) =>
  //   console.log(snowflake, guild.id)
  // );

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

  client.on(Events.GuildCreate, async (guild) => {
    if (await getServer(new Long(guild.id))) return;

    const server: Server = {
      uid: new Long(guild.id),
      name: guild.name,
      users: [],
      trades: [],
      commentPeriod: getDefaultTimeframes("commentPeriod") * 60,
      reminderPeriod: getDefaultTimeframes("reminderPeriod") * 60,
    };
    if (guild.systemChannelId)
      server.announcementsChannel = new Long(guild.systemChannelId);

    await addServer(server);

    if (guild.systemChannel) {
      guild.systemChannel.send(
        "Hello there! I'm Music Trade 2000, and I help people make music trades!\nTo get started, run `/help`."
      );
    }
  });

  client.on(Events.GuildUpdate, async (_, newGuild) => {
    await updateServerName(new Long(newGuild.id), newGuild.name);
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
