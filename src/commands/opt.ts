import {
  type ButtonInteraction,
  type CacheType,
  type ChatInputCommandInteraction,
  InteractionContextType,
  MessageFlags,
  SlashCommandBuilder,
} from "discord.js";
import type { DiscordCommand } from "../types";
import { isInServer } from "../util";
import { Long } from "mongodb";
import { addServerUser, fetchServerUser, fetchUser, setOpt } from "../mongo";

const opt: DiscordCommand = {
  data: new SlashCommandBuilder()
    .setName("opt")
    .setDescription("Opts in or out to this server's song trades.")
    .setContexts(InteractionContextType.Guild)
    .addSubcommand((builder) =>
      builder
        .setName("in")
        .setDescription("Opts in to this server's song trades.")
    )
    .addSubcommand((builder) =>
      builder
        .setName("out")
        .setDescription("Opts out of this server's music trades")
    ),

  async execute(interaction) {
    switch (interaction.options.getSubcommand()) {
      case "in":
        await optIn(interaction);
        return;

      case "out":
        await optOut(interaction);
        return;

      default:
        await interaction.reply({
          content: "How did you call a subcommand that doesn't exist!?",
          flags: MessageFlags.Ephemeral,
        });
    }
  },
};

export default opt;

/**
 * Opts the user in to the interaction server's song trades given an interaction
 *
 * @param interaction the interaction to respond to
 * @returns a blank Promise that resolves when this interaction is complete
 */
export async function optIn(
  interaction:
    | ChatInputCommandInteraction<CacheType>
    | ButtonInteraction<CacheType>
) {
  if (!isInServer(interaction)) return;

  // console.log("deferring reply...", {
  //   deferReply: interaction.deferReply,
  //   deferred: interaction.deferred,
  //   replied: interaction.replied,
  // });
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  // console.log("attempting to fetch server user profile");
  const serverID = new Long(interaction.guildId),
    userID = new Long(interaction.user.id);
  const user = await fetchUser(userID);
  if (!user) {
    await interaction.editReply(
      "You don't have an account yet! Register first with `/profile create` before trying to opt into music trades."
    );
    return;
  }

  // console.log("attempting to opt in...");
  const successful = (await fetchServerUser(serverID, userID)) // if server user exists
    ? await setOpt(serverID, userID, true)
    : await addServerUser(serverID, { uid: userID, optedIn: true });

  await interaction.editReply(
    successful
      ? `You have successfully opted into ${interaction.guild?.name}'s music trades!`
      : "Something went horribly wrong! Please let the server owner know that you can't opt into trades!"
  );
}

/**
 * Opts the user out of the interaction server's song trades given an interaction
 *
 * @param interaction the interaction to respond to
 * @returns a blank Promise that respolves when this interaction is complete
 */
export async function optOut(
  interaction:
    | ChatInputCommandInteraction<CacheType>
    | ButtonInteraction<CacheType>
) {
  if (!isInServer(interaction)) return;

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const serverID = new Long(interaction.guildId),
    userID = new Long(interaction.user.id);
  const user = await fetchUser(userID);
  if (!user) {
    await interaction.editReply(
      "You don't have an account yet! Register first before trying to opt out of music trades."
    );
  }

  const successful = (await fetchServerUser(serverID, userID)) // if server user exists
    ? await setOpt(serverID, userID, false)
    : await addServerUser(serverID, { uid: userID, optedIn: false });

  await interaction.editReply(
    successful
      ? `You have successfully opted out of ${interaction.guild?.name}'s music trades!`
      : "Something went horribly wrong! Please let the server owner know that you can't opt out of trades!"
  );
}
