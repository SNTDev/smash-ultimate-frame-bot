const Discord = require("discord.js");
const auth = require('./auth.json');
const fs = require('fs');
const { scrapAll, postFrameData } = require('./ultimate-crawler');
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
      const frameDataMsg = await channel.send(postFrameData(charFrameData['joker']['Side B']));

      await frameDataMsg.react('👀');

      const filter = (reaction, user) => {
        return reaction.emoji.name === '👀' && user.id != client.user.id;
      };

      const collector = frameDataMsg.createReactionCollector({filter, time: 30000});
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

init();