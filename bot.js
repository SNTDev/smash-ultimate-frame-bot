const Discord = require('discord.js');
const dotenv = require('dotenv');
dotenv.config();

const PGClient = require('pg').Client;
const fs = require('fs');

const { scrapAll } = require('./ultimate-crawler');
const { FrameBot } = require('./message-poster');

const Intents = Discord.Intents;
const client = new Discord.Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS] });
const numberReactions = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '0️⃣'];

let characterNames = [];
// let character_move_names = [];
let db;
let allCharacterFrameData;

async function initDB() {
  const client = new PGClient(process.env.DATABASE_URL);
  await client.connect();

  return client;
}

async function isNicknameInDB(nickname) {
  const res = await db.query('SELECT character FROM character_nickname WHERE nickname = ($1)', [nickname]);

  return res.rows.length > 0;
}

async function init() {
  db = await initDB();
  allCharacterFrameData = fs.existsSync('./character-frame-data.json') ? JSON.parse(fs.readFileSync('./character-frame-data.json')) : await scrapAll();

  const frameBot = new FrameBot(db, client, allCharacterFrameData);

  client.on("ready", () => {
    console.log(`Logged in as ${client.user.tag}!`);
  });

  client.on("messageCreate", async msg => {
    const channel = msg.channel;

    if (msg.content.startsWith('?') && msg.content.split(' ')[0] == "?프레임") {
      await frameBot.runFrameCommand(msg);
    } else if (msg.content.startsWith('?') && msg.content.split(' ')[0] == "?약어추가") {
      await frameBot.runAddNicknameCommand(msg);
    } else if (msg.content.startsWith('?') && msg.content.split(' ')[0] == "?약어제거") {
      await frameBot.runRemoveNicknameCommand(msg);
    }
  });

  client.login(process.env.TOKEN);
}

init();