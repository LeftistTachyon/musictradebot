import { Long } from "bson";
import {
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";
import { createContinueActionRow } from "../buttons/createUpdateProfile";
import { fetchUser, upsertUser } from "../mongo";
import { FormHandler, User } from "../types";

export const handleProfileForm1: FormHandler = {
  name: "profile-form1",

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    // check if is new
    const uid = new Long(interaction.user.id),
      isNew = !Boolean(await fetchUser(uid));

    // write known new data
    const newUser: User = {
      uid,
      name: interaction.fields.getTextInputValue("name"),
    };

    const bio = interaction.fields.getTextInputValue("bio");
    if (bio.length) newUser.bio = bio;
    const likedGenres = interaction.fields.getTextInputValue("likedGenres");
    if (likedGenres.length) newUser.likedGenres = likedGenres;
    const dislikedGenres =
      interaction.fields.getTextInputValue("dislikedGenres");
    if (dislikedGenres.length) newUser.dislikedGenres = dislikedGenres;
    const artists = interaction.fields.getTextInputValue("artists");
    if (artists.length) newUser.artists = artists;

    const success = await upsertUser(newUser);

    if (success) {
      await interaction.editReply({
        content: isNew
          ? "Continue creating your profile by clicking the button below."
          : "Continue editing your profile by clicking the button below.",
        components: [createContinueActionRow(isNew)],
      });
    } else {
      await interaction.editReply(
        "Something went horribly wrong! Please let the server owner know that you can't create a profile!"
      );
    }
  },
};
export const handleProfileForm2: FormHandler = {
  name: "profile-form2",
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const newUser: Partial<User> = {
      uid: new Long(interaction.user.id),
    };

    const favoriteSongs = interaction.fields.getTextInputValue("favoriteSongs");
    if (favoriteSongs.length) newUser.favoriteSongs = favoriteSongs;
    const newArtists = interaction.fields.getTextInputValue("newArtists");
    if (newArtists.length) newUser.newArtists = newArtists;
    const favoriteSounds =
      interaction.fields.getTextInputValue("favoriteSounds");
    if (favoriteSounds.length) newUser.favoriteSounds = favoriteSounds;
    const instruments = interaction.fields.getTextInputValue("instruments");
    if (instruments.length) newUser.instruments = instruments;

    const success = await upsertUser(newUser);

    if (success) {
      await interaction.editReply(
        "You have successfully created/edited your profile! You can now opt in to various servers' song trades."
      );
    } else {
      await interaction.editReply(
        "Something went horribly wrong! Please let the server owner know that you can't create a profile!"
      );
    }
  },
};

export function generateProfileForm1(user: User | null) {
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

  if (user) {
    preferredNameInput.setValue(user.name);

    if (user.bio) bioInput.setValue(user.bio);
    if (user.likedGenres) likedGenresInput.setValue(user.likedGenres);
    if (user.dislikedGenres) dislikedGenresInput.setValue(user.dislikedGenres);
    if (user.artists) artistsInput.setValue(user.artists);
  }

  return new ModalBuilder()
    .setCustomId("profile-form1")
    .setTitle((user ? "Edit" : "Create") + " Your Profile (Part 1)")
    .addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        preferredNameInput
      ),
      new ActionRowBuilder<TextInputBuilder>().addComponents(bioInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(likedGenresInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        dislikedGenresInput
      ),
      new ActionRowBuilder<TextInputBuilder>().addComponents(artistsInput)
    );
}

export function generateProfileForm2(user: User | null, verb = "Create/Edit") {
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
    if (user.favoriteSongs) favoriteSongsInput.setValue(user.favoriteSongs);
    if (user.newArtists) newArtistsInput.setValue(user.newArtists);
    if (user.favoriteSounds) favoriteSoundsInput.setValue(user.favoriteSounds);
    if (user.instruments) instrumentsInput.setValue(user.instruments);
  }

  return new ModalBuilder()
    .setCustomId("profile-form2")
    .setTitle(verb + " Your Profile (Part 2)")
    .addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        favoriteSongsInput
      ),
      new ActionRowBuilder<TextInputBuilder>().addComponents(newArtistsInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        favoriteSoundsInput
      ),
      new ActionRowBuilder<TextInputBuilder>().addComponents(instrumentsInput)
    );
}
