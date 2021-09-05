const Discord = require('discord.js');
const dotenv = require('dotenv');
const redis = require("redis");
dotenv.config({});

const pg = require('pg');
const PGPool = pg.Pool;
const fs = require('fs');

const { scrapAll } = require('./ultimate-crawler');
const { FrameBot } = require('./frame-message-poster');
const { MatchupBot } = require('./matchup-message-poster');

const Intents = Discord.Intents;
const client = new Discord.Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS] });

async function initDB() {
  const pool = !!process.env.DATABASE_URL ? new PGPool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
  }) : new PGPool();
  await pool.connect();
  pool.on('error', (err, client) => {
    console.log('postgres connection error : ' + err);
  });

  return pool;
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
  // const db = await initDB();
  // const redis = await initRedis();
  const redis = null;

  const allCharacterFrameData = fs.existsSync('./character-frame-data.json') ? JSON.parse(fs.readFileSync('./character-frame-data.json')) : await scrapAll();

  client.on("ready", () => {
    console.log(`Logged in as ${client.user.tag}!`);
  });

  client.on("messageCreate", async msg => {
    const db = await initDB();
    if (msg.content.startsWith('?') && msg.content.split(' ')[0] == "?프레임") {
      const frameBot = new FrameBot(db, client, allCharacterFrameData);
      await frameBot.runFrameCommand(msg);
    } else if (msg.content.startsWith('?') && msg.content.split(' ')[0] == "?약어추가") {
      const frameBot = new FrameBot(db, client, allCharacterFrameData);
      await frameBot.runAddNicknameCommand(msg);
    } else if (msg.content.startsWith('?') && msg.content.split(' ')[0] == "?약어제거") {
      const matchupBot = new MatchupBot(db, redis, client, allCharacterFrameData);
      await frameBot.runRemoveNicknameCommand(msg);
    } else if (msg.content.startsWith('?') && msg.content.split(' ')[0] == "?맵별승률") {
      const matchupBot = new MatchupBot(db, redis, client, allCharacterFrameData);
      await matchupBot.runMatchupCommand(msg);
    }
  });

  client.login(process.env.TOKEN);
}

init();