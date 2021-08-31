const Discord = require('discord.js');
const dotenv = require('dotenv');
const redis = require("redis");
dotenv.config({});

const pg = require('pg');
const PGClient = pg.Client;
const fs = require('fs');

const { scrapAll } = require('./ultimate-crawler');
const { FrameBot } = require('./frame-message-poster');
const { MatchupBot } = require('./matchup-message-poster');

const Intents = Discord.Intents;
const client = new Discord.Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS] });

async function initDB() {
  const client = !!process.env.DATABASE_URL ? new PGClient({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
  }) : new PGClient();
  await client.connect();

  return client;
}

async function initRedis() {
  const client = redis.createClient({
    socket: {
      url: process.env.REDIS_URL,
    },
  });
  client.on('error', (err) => console.log('Redis Client Error', err));

  await client.connect();

  return client;
}

async function init() {
  const db = await initDB();
  const redis = await initRedis();
  
  const allCharacterFrameData = fs.existsSync('./character-frame-data.json') ? JSON.parse(fs.readFileSync('./character-frame-data.json')) : await scrapAll();

  const frameBot = new FrameBot(db, client, allCharacterFrameData);
  const matchupBot = new MatchupBot(db, redis, client, allCharacterFrameData);

  client.on("ready", () => {
    console.log(`Logged in as ${client.user.tag}!`);
  });

  client.on("messageCreate", async msg => {
    if (msg.content.startsWith('?') && msg.content.split(' ')[0] == "?프레임") {
      await frameBot.runFrameCommand(msg);
    } else if (msg.content.startsWith('?') && msg.content.split(' ')[0] == "?약어추가") {
      await frameBot.runAddNicknameCommand(msg);
    } else if (msg.content.startsWith('?') && msg.content.split(' ')[0] == "?약어제거") {
      await frameBot.runRemoveNicknameCommand(msg);
    } else if (msg.content.startsWith('?') && msg.content.split(' ')[0] == "?맵별승률") {
      await matchupBot.runMatchupCommand(msg);
    }
  });

  client.login(process.env.TOKEN);
}

init();