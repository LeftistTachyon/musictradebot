import { SlashCommandBuilder } from "discord.js";
import { Long } from "bson";
import { fetchServerUser, fetchUser } from "../mongo";
import { DiscordCommand } from "../types";
import { profileString } from "../util";

const profile: DiscordCommand = {
  data: new SlashCommandBuilder()
    .setName("profile")
    .addUserOption((option) =>
      option.setName("user").setDescription("The user to pull the profile of")
    )
    .setDescription("Fetch your own or somebody else's music profile"),

  async execute(interaction) {
    if (interaction.guildId) {
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
        interaction.editReply(
          `**${name}'s Music Profile**:${profileString(userProfile)}`
        );
      } else {
        interaction.editReply(
          `Sorry, ${u.username} does not have a music profile.`
        );
      }
    } else
      interaction.reply({
        content: "Sorry, this command only works in servers I'm in!",
        ephemeral: true,
      });
  },
};

export default profile;
