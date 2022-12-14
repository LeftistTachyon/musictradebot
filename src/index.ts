import { Client, Events, GatewayIntentBits } from "discord.js";
import init, { close } from "./mongo";
import commands from "./commands";
import { DateTime } from "luxon";

async function run() {
  try {
    await init;
  } finally {
    await close();
  }
}

run().catch(console.dir);

const client: Client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  // console.dir(interaction);
  // console.log(
  //   DateTime.fromMillis(
  //     (Number(interaction.id) >> 22) + 1420070400000
  //   ).toString()
  // );
  // I tried :(

  const command = commands.get(interaction.commandName);

  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found.`);
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    await interaction.reply({
      content: "Therew as an error while executing this command!",
      ephemeral: true,
    });
  }
});

client.once(Events.ClientReady, (c) => {
  console.log(`Ready! Logged in as ${c.user.tag}`);
});

client.login(process.env.DISCORD_TOKEN);
