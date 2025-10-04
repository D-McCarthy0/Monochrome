const { SlashCommandBuilder } = require('@discordjs/builders');
const { useMainPlayer } = require('discord-player');
const { EmbedBuilder } = require('discord.js');
const wait = require('util').promisify(setTimeout);


async function suggest(interaction) {
    const query = interaction.options.getString('input', false)?.trim();
    if (!query) return;

    const player = useMainPlayer();

    const searchResult = await player.search(query).catch(() => null);
    if (!searchResult) {
        return interaction.respond([{ name: 'No results found', value: '' }]);
    }
    const tracks = searchResult.hasPlaylist()
        ? searchResult.playlist.tracks.slice(0, 24)
        : searchResult.tracks.slice(0, 10);

    const formattedResult = tracks.map((track) => {
        const maxLength = 100 - (track.author.length + 2); 
        const truncatedTitle = track.title.length > maxLength ? track.title.slice(0, maxLength - 3) + '...' : track.title;

        return {
            name: track.title.slice(0, 100),
            value: track.url,
        };
    });

    await interaction.respond(formattedResult);
}


module.exports = {
    category: 'audio',
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Plays a URL or searches YouTube')
        .addStringOption(option =>
            option
                .setName('input')
                .setDescription('Put YouTube video URL, video title, YouTube playlist here')
                .setRequired(true)
                .setAutocomplete(true)),
    async autocomplete(interaction) {
        await suggest(interaction);
    },
    async execute(interaction) {
        await interaction.deferReply();
        const player = useMainPlayer();
        const channel = interaction.member.voice.channel;
        const query = interaction.options.getString('input', true);

        if (!channel) {
            return interaction.followUp('You are not connected to a voice channel!');
        }

        try {
            const { track } = await player.play(channel, query, {
                nodeOptions: {
                    leaveOnEmpty: false,
                    leaveOnEnd: false,
                    leaveOnStop: false,
                }
            });

            const trackEmbed = new EmbedBuilder()
                .setColor(0x707a7e)
                .setTitle(`${track.title}`)
                .setURL(`${track.url}`)
                .setThumbnail(`${track.thumbnail}`)
                .setAuthor({ name: `${interaction.user.globalName} played: `, iconURL: `${interaction.user.displayAvatarURL({ dynamic: true, format: 'png', size: 4096 })}` })
                .setTimestamp();

            await interaction.followUp({ embeds: [trackEmbed] });
            await wait(60000);
            await interaction.deleteReply();

        } catch (error) {
            return interaction.followUp(`Something went wrong: ${error}`);
        }
    }
};
