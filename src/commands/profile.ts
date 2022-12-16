import { Long } from "bson";
import { SlashCommandBuilder } from "discord.js";
import { actionRow } from "../buttons/profileDelete";
import { fetchServerUser, fetchUser } from "../mongo";
import { DiscordCommand } from "../types";
import { isInServer, profileString } from "../util";

const profile: DiscordCommand = {
  data: new SlashCommandBuilder()
    .setName("profile")
    .setDescription("Create, update, or find a music profile")
    .addSubcommand((builder) =>
      builder
        .setName("find")
        .setDescription("Fetches your own or somebody else's music profile")
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("The user to pull the profile of")
        )
    )
    .addSubcommand((builder) =>
      builder.setName("create").setDescription("Creates a new music profile")
    )
    .addSubcommand((builder) =>
      builder
        .setName("update")
        .setDescription("Updates your existing music profile")
    )
    .addSubcommand((builder) =>
      builder.setName("delete").setDescription("Deletes your music profile")
    )
    .setDMPermission(true),

  async execute(interaction) {
    if (!isInServer(interaction)) return;

    const subCommand = interaction.options.getSubcommand();

    if (subCommand === "create") {
      // TODO: create "create profile" button
      await interaction.reply({
        content: "(Create button here)",
        ephemeral: true,
      });
    } else if (subCommand === "update") {
      // TODO: create "update profile" button
      await interaction.reply({
        content: "(Update button here)",
        ephemeral: true,
      });
    } else if (subCommand === "delete") {
      // TODO: create "delete profile" button
      await interaction.reply({
        content: "Are you sure you want to delete your profile?",
        components: [actionRow],
        ephemeral: true,
      });
    } else if (subCommand === "find") {
      await interaction.deferReply();

      const u = interaction.options.getUser("user", false) || interaction.user,
        userUID = new Long(u.id);
      const userProfile = await fetchUser(userUID);

      if (userProfile) {
        const serverUserProfile = await fetchServerUser(
          new Long(interaction.guildId),
          userUID
        );

        const name = serverUserProfile?.nickname ?? userProfile.name;
        await interaction.editReply(
          `**${name}'s Music Profile**:${profileString(userProfile)}`
        );
      } else {
        await interaction.editReply(
          `Sorry, ${u.username} does not have a music profile.`
        );
      }
    } else {
      await interaction.reply({
        content: "How did you even call a subcommand that doesn't exist!?",
        ephemeral: true,
      });
    }
  },
};

export default profile;
