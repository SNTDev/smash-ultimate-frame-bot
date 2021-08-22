const Discord = require('discord.js');
const dotenv = require('dotenv');
dotenv.config();

const PGClient = require('pg').Client;
const fs = require('fs');

const { scrapAll } = require('./ultimate-crawler');
const { createEmbedFrameMessage } = require('./message-poster');

const Intents = Discord.Intents;
const client = new Discord.Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS] });
const numberReactions = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '0️⃣'];

async function initDB() {
  const client = new PGClient();
  await client.connect();

  return client;
}

async function init() {
  const db = await initDB();
  const charFrameData = fs.existsSync('./character-frame-data.json') ? JSON.parse(fs.readFileSync('./character-frame-data.json')) : await scrapAll();

  client.on("ready", () => {
    console.log(`Logged in as ${client.user.tag}!`);
  })

  client.on("messageCreate", async msg => {
    const channel = msg.channel;
    
    if (msg.content.startsWith('?') && msg.content.split(' ')[0] == "?프레임") {
      const splited = msg.content.split(' ');
      if (splited.length != 3) {
        await channel.send(`명령어 규약이 맞지 않습니다.
\`\`\`?프레임 캐릭터이름 무브셋이름\`\`\``);
        return;
      }
      const charName = splited[1].toLowerCase();
      const moveName = splited[2].toLowerCase();
      const found = findMove(moveName, charFrameData[charName]).slice(0, 10);
      if (found.length > 1) {
        sendChoiceMessage(channel, charName, moveName, found);
      } else {
        sendFrameMessage(channel, charName, moveName, found[0]);
      }
    }
  })

  client.login(process.env.TOKEN);
}

async function sendChoiceMessage(channel, name, move, charMoves) {
  const description = charMoves.map((e, i) => `${i + 1 == 10 ? 0 : i+1}. ${e['displayname']}`).join('\n');

  const embedFrameMessageFields = {
    title: `Found Move List`,
    description,
    footer: {
        text: `React with number within 60s what you want to see`,
    },
  };

  const choiceMsg = await channel.send({ embeds: [embedFrameMessageFields] });
  for (let i = 0; i < charMoves.length; i++) {
    await choiceMsg.react(numberReactions[i]);
  }
  // await Promise.all(charMoves.map((e, i) => choiceMsg.react(numberReactions[i])));

  const filter = (reaction, user) => {
    return numberReactions.find((e) => e == reaction.emoji.name) && user.id != client.user.id;
  };

  const collector = choiceMsg.createReactionCollector({ filter, time: 60000 });
  collector.once('collect', (reaction) => {
    const index = numberReactions.findIndex((e) => e == reaction.emoji.name);
    sendFrameMessage(channel, name, move, charMoves[index]);
  });
}

async function sendFrameMessage(channel, name, move, charMoveFrameData) {
  const capitalize = s => s && s[0].toUpperCase() + s.slice(1);
  const embedFrameData = createEmbedFrameMessage(capitalize(name), charMoveFrameData);
  const frameDataMsg = await channel.send({ embeds: [embedFrameData] });
  const filter = (reaction, user) => {
    return reaction.emoji.name === '👀' && user.id != client.user.id;
  };

  await frameDataMsg.react('👀');
  const collector = frameDataMsg.createReactionCollector({ filter, time: 60000 });
  collector.once('collect', async (reaction) => {
    await Promise.all(charMoveFrameData['hitbox'].map((e, i) => {
      return channel.send({
        embeds: [{
          title: `${capitalize(name)} - ${charMoveFrameData['displayname']} - hitbox ${i + 1}`,
          image: {
            url: charMoveFrameData['hitbox'][i],
          },
        }]
      });
    }));
  });
}

function findMove(move, charFrameData) {
  const keys = Object.keys(charFrameData);
  const res = [];

  keys.forEach((k) => {
    if(k.includes(move)) {
      res.push(charFrameData[k]);
    }
  });

  return res;
}

init();