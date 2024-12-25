# Music Trader 2000

A music trading bot for Discord servers galore!

[Invite link](https://discord.com/api/oauth2/authorize?client_id=1052703572510384148&permissions=411648&redirect_uri=https%3A%2F%2Fgithub.com%2FLeftistTachyon%2Fmusictradebot%2Ftree%2Fmaster&scope=bot%20applications.commands)

## Environment

This bot requires a `.env` file in the project directory with the following values to function:
| **Variable name** | **Value** |
|-------------------|-----------|
| `DISCORD_TOKEN` | The bot token from the Discord Developer Portal |
| `CLIENT_ID` | The client ID taken from the Discord Developer Portal |
| `GUILD_ID` (optional) | The guild ID for the guild to deploy to when deploying slash commands to only one guild |
| `MY_ID` | The Discord client ID of the owner (for admin commands) |
| `MONGO_URI` | The URI to the Mongo database that is being used for this bot |
| `PASTEBIN_KEY` | The API key to a Pastebin account for the bot |
