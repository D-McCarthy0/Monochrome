const { Events } = require('discord.js');
const { useMainPlayer } = require('discord-player');
const fs = require('fs');
const path = require('path');
const player = useMainPlayer();
let urlPath = path.join(__dirname, '../userdata/userURLs.json');

module.exports = {
    name: Events.VoiceStateUpdate,
    async execute(oldState, newState) {
        try {
            const wasInVoiceChannel = oldState && oldState.channelId;
            const isInVoiceChannel = newState.channelId;
            const primary = '389618932715094020';
            const test = '1220654441888350259';

            if (!wasInVoiceChannel && isInVoiceChannel) {
                if (fs.existsSync(urlPath)) {
                    const urlsFromFile = JSON.parse(fs.readFileSync(urlPath, 'utf8'));
                    userURLs = new Map(urlsFromFile);
                } else {
                    userURLs = new Map();
                }

                if (!userURLs) {
                    console.log("userURLs is not initialized or empty.");
                    return;
                }

                const url = userURLs.get(newState.member.id);
                if (!url) {
                    return;
                }

                const { track } = await player.play(isInVoiceChannel, url, {
                    nodeOptions: {
                        leaveOnEmpty: false,
                        leaveOnEnd: false,
                        leaveOnStop: false,
                    }});
                if (!track) {
                    console.log(`Failed to play URL for user ${newState.member.id}`);
                    return;
                }
            }
        } catch (error) {
            console.log(`Error in playing join sound - ${error}`);
            return;
        }
    },
};
