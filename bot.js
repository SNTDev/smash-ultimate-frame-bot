const Discord = require("discord.js");
const auth = require('./auth.json');
const fs = require('fs');
const { scrapAll } = require('./ultimate-crawler');
const Intents = Discord.Intents;
const client = new Discord.Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS] });

async function init() {
  const charFrameData = fs.existsSync('./character-frame-data.json') ? JSON.parse(fs.readFileSync('./character-frame-data.json')) : await scrapAll();
  client.on("ready", () => {
    console.log(`Logged in as ${client.user.tag}!`);
  })

  client.on("messageCreate", async msg => {
    const channel = msg.channel;
    if (msg.content === "조커 옆비") {
      const frameDataMsg = await channel.send(postFrameData('Joker', charFrameData['joker']['Side B']));

      await frameDataMsg.react('👀');

      const filter = (reaction, user) => {
        return reaction.emoji.name === '👀' && user.id != client.user.id;
      };

      const collector = frameDataMsg.createReactionCollector({filter, time: 60000});
      collector.once('collect', async (reaction) => {
        console.log(reaction.emoji.name);
        await channel.send({
          files: charFrameData['joker']['Side B']['hitbox']
        });
      });
    }
  })

  client.login(auth.token);
}

function postFrameData(charName, charFrameData) {
  return `${charName} - ${charFrameData['movename']}
\`\`\`css
${charFrameData['startup']} Frame Startup
[${charFrameData['advantage']} On Shield]
Active on ${charFrameData['activeframes']}

${charFrameData['totalframes']} Total Frames
${charFrameData['landinglag']} Frames Landing Lag
${charFrameData['basedamage']}% Base Damage
${charFrameData['shieldlag']} Shield Lag
${charFrameData['shieldstun']} Shield Stun
Note: ${charFrameData['notes'].replace(/'/g, '`')}
\`\`\`
React with 👀 within 60s if you want to see the hitbox`
}

init();