const { SlashCommandBuilder } = require('@discordjs/builders');
const { useMainPlayer } = require('discord-player');
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
                .setRequired(true)),
                
    async execute(interaction) {
        await interaction.deferReply();
        
        // Use the same player method as voiceupdate.js
        const player = useMainPlayer();
        const channel = interaction.member.voice.channel;
        const query = interaction.options.getString('input', true);

        if (!channel) {
            return interaction.followUp('You are not connected to a voice channel!');
        }

        try {
            // Play exactly like voiceupdate.js does
            const { track } = await player.play(channel, query, {
                nodeOptions: {
                    metadata: interaction,
                    leaveOnEmpty: false,
                    leaveOnEnd: false,
                    leaveOnStop: false,
                }
            });
            
            if (!track) {
                console.log(`Failed to play: ${query}`);
                return interaction.followUp('❌ Failed to play the requested track.');
            }

            // Create embed only if track successfully starts
            const trackEmbed = new EmbedBuilder()
                .setColor(0x707a7e)
                .setTitle(track.title || 'Unknown Title')
                .setURL(track.url || '')
                .setThumbnail(track.thumbnail || '')
                .setAuthor({ 
                    name: `${interaction.user.globalName || interaction.user.username} played:`, 
                    iconURL: interaction.user.displayAvatarURL({ dynamic: true, format: 'png', size: 4096 })
                })
                .setTimestamp();

            const message = await interaction.followUp({ embeds: [trackEmbed] });
            
            // Delete message after 60 seconds
            setTimeout(async () => {
                try {
                    await message.delete();
                } catch (error) {
                    // Message might already be deleted
                    console.log('Could not delete play message:', error.message);
                }
            }, 60000);

        } catch (error) {
            console.log(`Error in play command - ${error}`);
            return interaction.followUp(`❌ Something went wrong: ${error.message || 'Unknown error'}`);
        }
    }
};