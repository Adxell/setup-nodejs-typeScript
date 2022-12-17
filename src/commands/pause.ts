import { SlashCommandBuilder, ApplicationCommandOptionType } from "discord.js";

const pauseCommand = new SlashCommandBuilder()
    .setName("pause")
    .setDescription("Pause the music")



export default pauseCommand.toJSON();
