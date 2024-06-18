const Discord = require('discord.js');
const dotenv = require('dotenv');
const redis = require("redis");
dotenv.config({});

const pg = require('pg');
const PGClient = pg.Client;
const PGPool = pg.Pool;
const fs = require('fs');

const { scrapAll } = require('./ultimate-crawler');
const { FrameBot } = require('./frame-message-poster');
const { MatchupBot } = require('./matchup-message-poster');
const { env } = require('process');

const Intents = Discord.Intents;
const client = new Discord.Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS] });

async function initDB() {
  const client = !!process.env.DATABASE_URL ? new PGPool({
    connectionString: process.env.DATABASE_URL,
    max: 5,
    // ssl: {
    //   rejectUnauthorized: false,
    // },
  }) : new PGClient();
  // await client.connect();
  // client.on('error', (err, client) => {
  //   console.log('postgres connection error : ' + err);
  // });

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
  const allCharacterFrameData = fs.existsSync('./character-frame-data.json') ? JSON.parse(fs.readFileSync('./character-frame-data.json')) : await scrapAll();

  const db = await initDB();
  // const redis = await initRedis();
  const redis = null;

  client.on("ready", () => {
    console.log(`Logged in as ${client.user.tag}!`);
  });

  const frameBot = new FrameBot(db, client, allCharacterFrameData);

  client.on("messageCreate", async msg => {
    if (msg.content.startsWith('?') && msg.content.split(' ')[0] == "?프레임") {
      await frameBot.runFrameCommand(msg);
    } else if (msg.content.startsWith('?') && msg.author.id == env.ADMIN_USER_ID && msg.content.split(' ')[0] == "?약어추가") {
      await frameBot.runAddNicknameCommand(msg);
    } else if (msg.content.startsWith('?') && msg.author.id == env.ADMIN_USER_ID && msg.content.split(' ')[0] == "?약어제거") {
      await frameBot.runRemoveNicknameCommand(msg);
    } else if (msg.content.startsWith('?') && msg.content.split(' ')[0] == "?딩동") {
      await frameBot.runDingDongCommand(msg);
    } else if (msg.content.startsWith('?') && msg.content.split(' ')[0] == "?맵별승률") {
      // https://ultimategamedata.com/ 사이트가 업뎃이 멈춰서 쓸 이유가 없다 생각해서 matchupbot은 잠시 주석처리
      // 어찌할지는 추후 생각해보겠슴

      // const db = await initDB();
      // const matchupBot = new MatchupBot(db, redis, client, allCharacterFrameData);
      // await matchupBot.runMatchupCommand(msg);
      // db.end();
    } else if (msg.content.startsWith('?') && (msg.content.split(' ')[0] == "?재생" || msg.content.split(' ')[0] == "?play")) {
      // const db = await initDB();
      // const matchupBot = new MatchupBot(db, redis, client, allCharacterFrameData);
      // await matchupBot.runMatchupCommand(msg);
      // db.end();
    }
  });

  client.login(process.env.TOKEN);
}

init();