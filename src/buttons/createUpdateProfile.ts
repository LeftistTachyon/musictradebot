import { Long } from "bson";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";
import { fetchUser } from "../mongo";
import { ButtonHandler } from "../types";

export const createUpdateProfile: ButtonHandler = {
  name: "profile-updateCreate",
  async execute(interaction) {
    const user = await fetchUser(new Long(interaction.user.id));

    const preferredNameInput = new TextInputBuilder()
      .setCustomId("name")
      .setLabel("Preferred name")
      .setPlaceholder("The name you want everyone to see")
      .setRequired(true)
      .setStyle(TextInputStyle.Short);
    const bioInput = new TextInputBuilder()
      .setCustomId("bio")
      .setLabel("Musical Biography")
      .setPlaceholder(
        "Write about who you are and how you got into music. Let others get to know you better!"
      )
      .setRequired(false)
      .setStyle(TextInputStyle.Paragraph);
    const likedGenresInput = new TextInputBuilder()
      .setCustomId("likedGenres")
      .setLabel("Liked Genres")
      .setPlaceholder("List some of your favorite genres here.")
      .setRequired(false)
      .setStyle(TextInputStyle.Paragraph);
    const dislikedGenresInput = new TextInputBuilder()
      .setCustomId("dislikedGenres")
      .setLabel("Disliked Genres")
      .setPlaceholder(
        "List some of the genres that people recommending you songs should steer clear of."
      )
      .setRequired(false)
      .setStyle(TextInputStyle.Paragraph);
    const artistsInput = new TextInputBuilder()
      .setCustomId("artists")
      .setLabel("Artists Most Listened To")
      .setPlaceholder(
        "List some of the artists that you've been listening to the most as of recent."
      )
      .setRequired(false)
      .setStyle(TextInputStyle.Paragraph);
    const favoriteSongsInput = new TextInputBuilder()
      .setCustomId("favoriteSongs")
      .setLabel("Favorite Songs")
      .setPlaceholder(
        "List some of your favorite songs! List as many as you want."
      )
      .setRequired(false)
      .setStyle(TextInputStyle.Paragraph);
    const newArtistsInput = new TextInputBuilder()
      .setCustomId("newArtists")
      .setLabel("Newly Discovered Artists")
      .setPlaceholder(
        "List some of the artists that you've found recently that fit your fancy."
      )
      .setRequired(false)
      .setStyle(TextInputStyle.Paragraph);
    const favoriteSoundsInput = new TextInputBuilder()
      .setCustomId("favoriteSounds")
      .setLabel("Favorite Sounds")
      .setPlaceholder(
        "List some of your favorite sounds, whether it's in songs or in general."
      )
      .setRequired(false)
      .setStyle(TextInputStyle.Paragraph);
    const instrumentsInput = new TextInputBuilder()
      .setCustomId("instruments")
      .setLabel("Instruments")
      .setPlaceholder(
        "List some instruments. Whether you like how they sound or you play them yourself, doesn't matter!"
      )
      .setRequired(false)
      .setStyle(TextInputStyle.Paragraph);

    if (user) {
      preferredNameInput.setValue(user.name);
      if (user.bio) bioInput.setValue(user.bio);
      if (user.likedGenres) likedGenresInput.setValue(user.likedGenres);
      if (user.dislikedGenres)
        dislikedGenresInput.setValue(user.dislikedGenres);
      if (user.artists) artistsInput.setValue(user.artists);
      if (user.favoriteSongs) favoriteSongsInput.setValue(user.favoriteSongs);
      if (user.newArtists) newArtistsInput.setValue(user.newArtists);
      if (user.favoriteSounds)
        favoriteSoundsInput.setValue(user.favoriteSounds);
      if (user.instruments) instrumentsInput.setValue(user.instruments);
    }

    await interaction.showModal(
      new ModalBuilder()
        .setCustomId("profile-updateCreateM1")
        .setTitle((user ? "Edit" : "Create") + " Your Profile (Part 1)")
        .addComponents(
          new ActionRowBuilder<TextInputBuilder>().addComponents(
            preferredNameInput
          ),
          new ActionRowBuilder<TextInputBuilder>().addComponents(bioInput),
          new ActionRowBuilder<TextInputBuilder>().addComponents(
            likedGenresInput
          ),
          new ActionRowBuilder<TextInputBuilder>().addComponents(
            dislikedGenresInput
          ),
          new ActionRowBuilder<TextInputBuilder>().addComponents(artistsInput)
          // new ActionRowBuilder<TextInputBuilder>().addComponents(
          //   favoriteSongsInput
          // ),
          // new ActionRowBuilder<TextInputBuilder>().addComponents(
          //   newArtistsInput
          // ),
          // new ActionRowBuilder<TextInputBuilder>().addComponents(
          //   favoriteSoundsInput
          // ),
          // new ActionRowBuilder<TextInputBuilder>().addComponents(
          //   instrumentsInput
          // )
        )
    );
  },
};

export const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
  new ButtonBuilder()
    .setLabel("Create/update profile")
    .setCustomId("profile-updateCreate")
    .setStyle(ButtonStyle.Primary)
);
