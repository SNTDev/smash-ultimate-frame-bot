const { MessageEmbed } = require('discord.js');

function createEmbedFrameMessage(charName, charFrameData) {
    const embedFrameMessageFields = {
        title: `${charName} - ${charFrameData['movename']}`,
        fields: [
            {
                name: 'Startup Frame',
                value: charFrameData['startup'] || '-',
            },
            {
                name: 'On Shield',
                value: charFrameData['advantage'] || '-',
            },
            {
                name: 'Active on',
                value: charFrameData['activeframes'] || '-',
            },
            {
                name: 'Total Frames',
                value: charFrameData['totalframes'] || '-',
            },
            {
                name: 'Landing Lag',
                value: charFrameData['landinglag'] || '-',
            },
            {
                name: 'Base Damage',
                value: charFrameData['basedamage'] || '-',
            },
            {
                name: 'Shield Lag',
                value: charFrameData['shieldlag'] || '-',
            },
            {
                name: 'Shield Stun',
                value: charFrameData['shieldstun'] || '-',
            },
            {
                name: 'Note',
                value: charFrameData['notes'] || '-',
            },
        ],
        footer: {
            text: `React with 👀 within 60s if you want to see the hitbox`,
        },
    }

    return embedFrameMessageFields;
}

module.exports = {
    createEmbedFrameMessage,
};