import { Client, GatewayIntentBits, REST, RESTPostAPIChatInputApplicationCommandsJSONBody, Routes, GuildMember, EmbedBuilder, ActivityType, ActivityFlags } from 'discord.js'
import dotenv from 'dotenv';


import { Player, QueryType, Queue } from 'discord-player'

import { playCommand, pauseCommand } from './commands';

dotenv.config()



const rest = new REST({ version: '10' }).setToken(
    process.env.TOKEN!
)

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates
    ]
})

client.login(process.env.TOKEN!)

client.on("ready", () => {
    console.log(`${client.user?.tag} has logged in!`)
})

const player = new Player(client, {
    ytdlOptions: {
        quality: "highestaudio",
        highWaterMark: 1 << 25
    }
})

player.on("trackStart", (queue: any, track) => {
    client.user?.setActivity({
        name: `${track.title}`,
        type: ActivityType.Listening,
        url: `${track.url}`,
    })
    if (track.playlist?.tracks.length) {
        let embedResponseOnTrack = new EmbedBuilder()
        embedResponseOnTrack
            .setColor(0x0099FF)
            .setDescription(`🎧Listenig | ** [${track.title}](${track.url}) ** has been added to the Queue`)
            .setThumbnail(track.thumbnail)
            .setFooter({ text: `Duration: ${track.duration} - Author: ${track.author}` })
        queue.metadata?.channel.send({ embeds: [embedResponseOnTrack] })
    }

    client.user?.setStatus('online')
})
client.on("interactionCreate", async (interaction) => {


    if (interaction.isChatInputCommand()) {
        if (interaction.commandName === "play") {
            const verificatedChannel = interaction.member as GuildMember
            if (!verificatedChannel.voice.channelId) {
                await interaction.reply({ content: "You are not in a voice channel!", ephemeral: true })
                return
            }

            if (interaction.guild?.members.me?.voice.channelId && verificatedChannel.voice.channelId !== interaction.guild?.members.me.voice.channelId) {
                await interaction.reply({ content: "You are not in my voice channel!", ephemeral: true })
                return
            };
            const queue = player.createQueue(interaction.guild!, {
                metadata: {
                    channel: interaction.channel,
                }
            });

            try {
                if (!queue.connection) {
                    await queue.connect(verificatedChannel.voice.channel!);
                }
            } catch {
                queue.destroy();
                await interaction.reply({ content: "Could not join your voice channel!", ephemeral: true });
                return
            }
            let embed = new EmbedBuilder()
            await interaction.deferReply()

            if (interaction.options.getSubcommand() === "song") {
                let url = interaction.options.getString("url")
                const track = await player.search(url!, {
                    requestedBy: interaction.user,
                    searchEngine: QueryType.YOUTUBE_VIDEO
                });
                if (track.tracks.length === 0) {
                    interaction.reply("No results 🥺")
                    return
                }
                const song = track.tracks[0]
                queue.addTrack(song);

                embed
                    .setColor(0x0099FF)
                    .setDescription(`🎧Listenig | **[${song.title}](${song.url})** has been added to the Queue`)
                    .setThumbnail(song.thumbnail)
                    .setFooter({ text: `Duration: ${song.duration} - Author: ${song.author}` })
                if (!queue.playing) {
                    await queue.play()
                }
                await interaction.followUp({ embeds: [embed] });
                return
            }
            if (interaction.options.getSubcommand() === 'playlist') {
                let url = interaction.options.getString('url')
                const result = await player.search(url!, {
                    requestedBy: interaction.user,
                    searchEngine: QueryType.YOUTUBE_PLAYLIST
                })


                if (result.tracks.length === 0) {
                    interaction.reply(`No playlists found with ${url}`)
                    return
                }

                const playlist = result.playlist
                queue.addTracks(result.playlist?.tracks!)
                embed
                    .setColor(0x0099FF)
                    .setDescription(`🎧Listenig | **${result.tracks.length} songs from [${playlist?.title}](${playlist?.url})** have been added to the Queue`)

                if (!queue.playing) {
                    await queue.play()
                }
                await interaction.followUp({ embeds: [embed] });
                return
            }
            if (interaction.options.getSubcommand() === "search") {
                let url = interaction.options.getString('searchterms')
                const result = await player.search(url!, {
                    requestedBy: interaction.user,
                    searchEngine: QueryType.AUTO
                })
                if (result.tracks.length === 0) {
                    interaction.editReply("No results")
                }
                const song = result.tracks[0]
                queue.addTrack(song)
                embed
                    .setColor(0x0099FF)
                    .setDescription(`🎧Listenig | ** [${song.title}](${song.url}) ** has been added to the Queue`)
                    .setThumbnail(song.thumbnail)
                    .setFooter({ text: `Duration: ${song.duration} - Author: ${song.author}` })
                if (!queue.playing) {
                    await queue.play()
                }
                await interaction.followUp({ embeds: [embed] });
                return
            }
            return
        }

        if (interaction.commandName === "pause") {
            const queue = player.getQueue(interaction.guildId!)
            if (!queue) {
                await interaction.reply("There are no songs in the queue")
                return
            }

            queue.setPaused(true);

            await interaction.reply('Player has been pasued')
        }

    }
})

async function main() {
    const commands: RESTPostAPIChatInputApplicationCommandsJSONBody[] = [
        playCommand,
        pauseCommand
    ];
    try {
        console.log("Started refreshing application (/) commands.");
        await rest.put(Routes.applicationCommands(process.env.CLIENT_ID!), {
            body: commands,
        });
        console.log("Endend refreshing application (/) commands.");
    } catch (error) {
        console.log(error)
    }
}

main()
