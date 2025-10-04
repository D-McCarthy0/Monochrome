const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');

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
        const query = interaction.options.getString('input', false)?.trim();
        if (!query) return;

        try {
            const player = interaction.client.player;
            const searchResult = await player.search(query, {
                requestedBy: interaction.user,
                searchEngine: 'youtube'
            }).catch(() => null);

            if (!searchResult || !searchResult.hasTracks()) {
                return interaction.respond([{ name: 'No results found', value: query }]);
            }

            const tracks = searchResult.tracks.slice(0, 10);
            const formattedResult = tracks.map((track) => ({
                name: `${track.title} - ${track.author}`.slice(0, 100),
                value: track.url,
            }));

            await interaction.respond(formattedResult);
        } catch (error) {
            console.error('Autocomplete error:', error);
            return interaction.respond([{ name: 'Error searching', value: '' }]);
        }
    },
    
    async execute(interaction) {
        await interaction.deferReply();
        
        const player = interaction.client.player;
        const channel = interaction.member.voice.channel;
        const query = interaction.options.getString('input', true);

        if (!channel) {
            return interaction.followUp('You are not connected to a voice channel!');
        }

        try {
            const { track, queue } = await player.play(channel, query, {
                requestedBy: interaction.user,
                nodeOptions: {
                    metadata: {
                        channel: interaction.channel,
                        client: interaction.client,
                        requestedBy: interaction.user
                    },
                    leaveOnEmpty: false,
                    leaveOnEnd: false,
                    leaveOnStop: false,
                    bufferingTimeout: 3000,
                    connectionTimeout: 30000,
                }
            });

            const trackEmbed = new EmbedBuilder()
                .setColor(0x707a7e)
                .setTitle(track.title)
                .setURL(track.url)
                .setThumbnail(track.thumbnail)
                .setAuthor({ 
                    name: `${interaction.user.globalName || interaction.user.username} played:`, 
                    iconURL: interaction.user.displayAvatarURL({ dynamic: true }) 
                })
                .setTimestamp();

            const reply = await interaction.followUp({ embeds: [trackEmbed] });
            
            // Delete after 60 seconds
            setTimeout(() => {
                reply.delete().catch(() => {});
            }, 60000);

        } catch (error) {
            console.error('Play command error:', error);
            return interaction.followUp({
                content: `❌ Could not play: ${error.message}`,
                ephemeral: true
            });
        }
    }
};