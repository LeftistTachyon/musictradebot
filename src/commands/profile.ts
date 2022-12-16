import { Long } from "bson";
import { SlashCommandBuilder } from "discord.js";
import { defaultActionRow as cuProfileActionRow } from "../buttons/createUpdateProfile";
import { actionRow as dProfileActionRow } from "../buttons/profileDelete";
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
        .setName("edit")
        .setDescription("Edits your existing music profile")
    )
    .addSubcommand((builder) =>
      builder.setName("delete").setDescription("Deletes your music profile")
    )
    .setDMPermission(true),

  async execute(interaction) {
    if (!isInServer(interaction)) return;

    const subCommand = interaction.options.getSubcommand();

    if (subCommand === "create" || subCommand === "edit") {
      await interaction.reply({
        content:
          "To create a new account or edit your existing one, click the button below.",
        components: [cuProfileActionRow],
        ephemeral: true,
      });
    } else if (subCommand === "delete") {
      const user = await fetchUser(new Long(interaction.user.id));

      if (user) {
        await interaction.reply({
          content: "Are you sure you want to delete your profile?",
          components: [dProfileActionRow],
          ephemeral: true,
        });
      } else {
        await interaction.reply({
          content: "You don't have an account to delete!",
          ephemeral: true,
        });
      }
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
