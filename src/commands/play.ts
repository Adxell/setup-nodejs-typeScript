import { SlashCommandBuilder, ApplicationCommandOptionType } from "discord.js";

const playCommand = new SlashCommandBuilder()
    .setName("play")
    .setDescription("play your favorite music")
    .addSubcommand((subcommand) => {
        return subcommand.setName("search")
            .setDescription("The song you want to play")
            .addStringOption(option => option
                .setName('searchterms')
                .setDescription('Search Kaywords')
                .setRequired(true)
            )
    })
    .addSubcommand(subcommand => {
        return subcommand
            .setName("playlist")
            .setDescription("plays a playlist from YT")
            .addStringOption(option => option
                .setName('url')
                .setDescription("the playlist's url")
                .setRequired(true)
            )
    })
    .addSubcommand(subcommand => {
        return subcommand
            .setName("song")
            .setDescription("Plays a single song from YT")
            .addStringOption(option => option
                .setName("url")
                .setDescription("the song's url")
                .setRequired(true)
            )
    })

export default playCommand.toJSON();
