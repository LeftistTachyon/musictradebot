import { Long } from "bson";
import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { Duration } from "luxon";
import { getServer } from "../mongo";
import { DiscordCommand } from "../types";
import { isInServer } from "../util";

const aboutserver: DiscordCommand = {
  data: new SlashCommandBuilder()
    .setName("aboutserver")
    .setDescription("Display various information about this server")
    .setDMPermission(false),

  async execute(interaction) {
    if (!isInServer(interaction)) return;

    await interaction.deferReply();

    const server = await getServer(new Long(interaction.guildId));
    if (!server) {
      await interaction.editReply(
        "Something went horribly wrong! Please let the server owner know that you can't fetch server settings!"
      );
      return;
    }

    let participantsValue = "";
    for (let idx = 0; idx < server.users.length; idx++) {
      if (!server.users[idx].optedIn) continue;

      const user = `<@${server.users[idx].uid}>\n`;
      if (participantsValue.length + user.length > 1006) {
        participantsValue += `...and ${server.users.length - idx} more`;
        break;
      }

      participantsValue += user;
    }

    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setTitle(server.name)
          .setThumbnail(interaction.guild.iconURL())
          .addFields(
            {
              name: "Announcements channel",
              value: `<#${server.announcementsChannel}>`,
            },
            {
              name: "Announcements mentionable role",
              value: server.pingableRole
                ? `<@&${server.pingableRole}>`
                : "none",
            }
          )
          .addFields(
            {
              name: "Song review period",
              value: Duration.fromObject({
                minutes: server.commentPeriod,
              }).toFormat("h 'hours,' m 'minutes'"),
            },
            {
              name: "Last-call reminder",
              value: Duration.fromObject({
                minutes: server.reminderPeriod,
              }).toFormat("h 'hours,' m 'minutes before ending'"),
            }
          )
          .addFields({ name: "Participants", value: participantsValue }),
      ],
    });
  },
};

export default aboutserver;
