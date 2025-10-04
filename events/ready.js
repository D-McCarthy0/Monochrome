const { Events } = require('discord.js');
const { useMainPlayer } = require('discord-player');
const { YoutubeiExtractor } = require("discord-player-youtubei");
const { DefaultExtractors } = require('@discord-player/extractor');

module.exports = {
    name: Events.ClientReady,
    once: true,
    async execute(client) {
        const player = useMainPlayer();
        console.log(`Ready! Logged in as ${client.user.tag}`);
        
        const excludedExtractors = [
            'VimeoExtractor',
            'SoundCloudExtractor',
            'ReverbnationExtractor',
            'BridgedExtractor',
            'AttachmentExtractor',
        ];
        
        await player.extractors.loadMulti(DefaultExtractors);
        player.extractors.register(YoutubeiExtractor, {});
        
        // Enhanced error handling
        player.events.on('playerError', (queue, error) => {
            console.error(`Player Error in queue [${queue.guild.name}]:`, error);
            
            // Handle AbortError specifically
            if (error.message.includes('AbortError') || error.code === 'ABORT_ERR') {
                console.log('Detected AbortError - attempting to recover...');
                // Don't crash, just log it
                return;
            }
        });
        
        player.events.on('error', (queue, error) => {
            console.error(`General Error [${queue.guild.name}]:`, error);
            
            // Handle AbortError specifically
            if (error.message.includes('AbortError') || error.code === 'ABORT_ERR') {
                console.log('Detected AbortError in general error - attempting to recover...');
                // Don't crash, just log it
                return;
            }
        });
        
        // Add connection error handler
        player.events.on('connectionError', (queue, error) => {
            console.error(`Connection Error [${queue.guild.name}]:`, error);
            
            // Try to destroy and recreate the connection if it's an AbortError
            if (error.message.includes('AbortError') || error.code === 'ABORT_ERR') {
                try {
                    queue.connection?.destroy();
                } catch (e) {
                    console.log('Failed to destroy connection:', e);
                }
            }
        });
        
        // Handle debug events to catch issues early
        player.events.on('debug', (queue, message) => {
            // Only log debug messages related to errors or important state changes
            if (message.toLowerCase().includes('error') || 
                message.toLowerCase().includes('abort') ||
                message.toLowerCase().includes('disconnect')) {
                console.log(`Debug [${queue.guild.name}]:`, message);
            }
        });
        
        // Global uncaught exception handler to prevent crashes
        process.on('unhandledRejection', (error) => {
            console.error('Unhandled promise rejection:', error);
            
            // Specifically handle AbortErrors without crashing
            if (error.message?.includes('AbortError') || error.code === 'ABORT_ERR') {
                console.log('Caught unhandled AbortError - bot will continue running');
                return;
            }
        });
        
        process.on('uncaughtException', (error) => {
            console.error('Uncaught exception:', error);
            
            // Specifically handle AbortErrors without crashing
            if (error.message?.includes('AbortError') || error.code === 'ABORT_ERR') {
                console.log('Caught uncaught AbortError - bot will continue running');
                return;
            }
            
            // For other critical errors, you might want to restart
            console.error('Critical error occurred - consider restarting the bot');
        });
    },
};;
