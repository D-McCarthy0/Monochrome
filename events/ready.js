const { Events } = require('discord.js');
const { useMainPlayer } = require('discord-player');

module.exports = {
    name: Events.ClientReady,
    once: true,
    async execute(client) {
        const player = useMainPlayer();
        console.log(`Ready! Logged in as ${client.user.tag}`);

        // This loads all extractors except the broken YouTube one
        await player.extractors.loadDefault((ext) => ext !== 'YouTubeExtractor');

        console.log('✅ Extractors loaded successfully');

        player.events.on('playerError', (queue, error) => {
            console.error(`Player Error in queue [${queue.guild.name}]:`, error);
        });

        player.events.on('error', (queue, error) => {
            console.error(`General Error [${queue.guild.name}]:`, error);
        });
    },
};