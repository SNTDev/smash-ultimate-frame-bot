const fs = require('fs');

const {CommonUtilBot, DBUtil} = require('./common');
const { MessageEmbed } = require('discord.js');

const allCharacterDingDongData = fs.existsSync('./dko-data.json') ? JSON.parse(fs.readFileSync('./dko-data.json')) : {};
class FrameBot {
  constructor(pool, client, allCharacterFrameData) {
    this.pool = pool;
    this.client = client;
    this.allCharacterFrameData = allCharacterFrameData;
  }

  async runFrameCommand(msg) {
    const db = await this.pool.connect();
    const frameCommand = new BotFrameCommand(this, db, msg);

    await frameCommand.run();
    
    await db.release();
  }

  async runAddNicknameCommand(msg) {
    const db = await this.pool.connect();
    const addNicknameCommand = new BotAddNicknameCommand(this, db, msg);

    await addNicknameCommand.run();

    await db.release();
  }

  async runRemoveNicknameCommand(msg) {
    const db = await this.pool.connect();
    const removeNicknameCommand = new BotRemoveNicknameCommand(this, db, msg);

    await removeNicknameCommand.run();

    await db.release();
  }

  async runDingDongCommand(msg) {
    const db = await this.pool.connect();
    const dingDongCommand = new BotDingDongCommand(this, db, msg);
    
    await dingDongCommand.run();
    
    await this.db.release();
  }
}

class BotCommand {
  constructor(bot, db, msg) {
    this.bot = bot;
    this.db = db;
    this.msg = msg;
  }
}
class BotFrameCommand extends BotCommand {
  constructor(bot, db, msg) {
    super(bot, db, msg);
    this.numberReactions = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '0️⃣'];
  }

  createEmbedFrameMessage(charName, charFrameData) {
    const embedFrameMessageFields = {
      title: `${charName} - ${charFrameData['displayname']}`,
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
        text: charFrameData['hitbox'].length > 0 ? `React with 👀 within 60s if you want to see the hitbox` : `No hitbox`,
      },
    }

    return embedFrameMessageFields;
  }

  async run() {
    const channel = this.msg.channel;
    const splited = this.msg.content.split(' ');
    if (splited.length != 3) {
      await channel.send(`명령어 규약이 맞지 않습니다. 다음 규약을 맞춰서 입력해주세요.
\`\`\`?프레임 캐릭터이름 무브셋이름\`\`\``);
      return;
    }
    const charName = (await DBUtil.getTranslatedCharacterName(this.db, splited[1].toLowerCase())).toLowerCase();
    const isCharacterMove = await DBUtil.isCharacterMoveNicknameInDB(this.db, splited[2].toLowerCase(), charName);
    const moveName = isCharacterMove ? (await DBUtil.getTranslatedCharacterMoveName(this.db, splited[2].toLowerCase(), charName)).toLowerCase()
                                     : (await DBUtil.getTranslatedMoveName(this.db, splited[2].toLowerCase())).toLowerCase();
    try {
      if (this.bot.allCharacterFrameData[charName] == null) {
        await channel.send(`캐릭터를 찾을 수 없습니다.`);
        return;
      }

      const found = this.findMove(moveName, this.bot.allCharacterFrameData[charName]).slice(0, 10);

      if (found.length == 0) {
        await channel.send(`무브셋을 찾을 수 없습니다.`);
        return;
      }
      else if (found.length > 1) {
        await this.sendChoiceMessage(charName, moveName, found);
      } else {
        await this.sendFrameMessage(charName, moveName, found[0]);
      }
    } catch (e) {
      console.log(e);
    }
  }

  async reactNumbers(choiceMsg, charMoves) {
    for (let i = 0; i < charMoves.length; i++) {
      await choiceMsg.react(this.numberReactions[i]);
    }
  }

  async sendChoiceMessage(name, move, charMoves) {
    const channel = this.msg.channel;
    const description = charMoves.map((e, i) => `${i + 1 == 10 ? 0 : i + 1}. ${e['displayname']}`).join('\n');

    const embedFrameMessageFields = {
      title: `Found Move List`,
      description,
      footer: {
        text: `React with number within 60s what you want to see`,
      },
    };

    const choiceMsg = await channel.send({ embeds: [embedFrameMessageFields] });
    this.reactNumbers(choiceMsg, charMoves);
    // await Promise.all(charMoves.map((e, i) => choiceMsg.react(numberReactions[i])));

    const filter = (reaction, user) => {
      return this.numberReactions.find((e) => e == reaction.emoji.name) && user.id == this.msg.author.id;
    };

    const collector = choiceMsg.createReactionCollector({ filter, time: 60000 });
    collector.once('collect', async (reaction) => {
      const index = this.numberReactions.findIndex((e) => e == reaction.emoji.name);
      await this.sendFrameMessage(name, move, charMoves[index]);
    });
  }

  async sendFrameMessage(name, move, charMoveFrameData) {
    const channel = this.msg.channel;

    const capitalize = s => s && s[0].toUpperCase() + s.slice(1);
    const embedFrameData = this.createEmbedFrameMessage(capitalize(name), charMoveFrameData);
    const frameDataMsg = await channel.send({ embeds: [embedFrameData] });
    const filter = (reaction, user) => {
      return reaction.emoji.name === '👀' && user.id != this.bot.client.user.id;
    };

    if(charMoveFrameData['hitbox'].length == 0) return;

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

  findMove(move, charFrameData) {
    const keys = Object.keys(charFrameData);
    const res = [];

    keys.forEach((k) => {
      if (k.includes(move)) {
        res.push(charFrameData[k]);
      }
    });

    return res;
  }
}

class BotAddNicknameCommand extends BotCommand {
  constructor(bot, db, msg) {
    super(bot, db, msg);
    this.characterNames = Object.keys(bot.allCharacterFrameData);
  }

  async run() {
    const channel = this.msg.channel;

    const splited = this.msg.content.split(' ');
    if (!(splited.length == 4 && (splited[1] == '캐릭터' || splited[1] == '무브셋'))
       && !(splited.length == 5 && (splited[1] == '고유무브셋'))) {
      await channel.send(`명령어 규약이 맞지 않습니다. 다음 규약을 맞춰서 입력해주세요. (약어와 이름에 공백은 있으면 안됩니다.)
\`\`\`?약어추가 캐릭터 추가할약어 캐릭터이름(약어)
or
?약어추가 무브셋 추가할약어 무브셋이름(약어)
or
?약어추가 고유무브셋 캐릭터(약어) 추가할약어 무브셋이름(약어)\`\`\``);
      return;
    }
    if (splited[1] == '캐릭터') {
      await this.runAddCharacterNicknameCommand();
    }
    else if (splited[1] == '무브셋') {
      await this.runAddMoveNicknameCommand();
    }
    else if (splited[1] == '고유무브셋') {
      await this.runAddCharacterMoveNicknameCommand();
    }
  }

  async runAddCharacterNicknameCommand() {
    const channel = this.msg.channel;
    const splited = this.msg.content.split(' ');
    const nickname = splited[2].toLowerCase();
    const charName = (await DBUtil.getTranslatedCharacterName(this.db, splited[3].toLowerCase())).toLowerCase();

    // 호카리, 포트 승률을 위한 예외처리 추가
    if (!this.characterNames.find(e => e == charName) && !(charName == 'pyra_and_mythra') && !(charName == 'pokemon_trainer')) {
      await channel.send(`해당되는 캐릭터가 없습니다.`);
      return;
    }
    try {
      // console.log(nickname, charName);
      await this.db.query(`INSERT INTO character_nickname(nickname, "character") VALUES ($1, $2)`, [nickname, charName]);

      await channel.send(`추가 완료! 이제 캐릭터 이름 ${splited[2]} -> ${charName}로 인식합니다.`);
    } catch (e) {
      console.log(e);
      if (e.code === '23505') {
        await channel.send(`약어 추가에 실패하였습니다. 이미 존재하는 약어입니다.`);
      }
    }
  }

  async runAddMoveNicknameCommand() {
    const channel = this.msg.channel;
    const splited = this.msg.content.split(' ');
    const nickname = splited[2].toLowerCase();
    const moveName = (await DBUtil.getTranslatedMoveName(this.db, splited[3].toLowerCase())).toLowerCase();

    try {
      // console.log(nickname, moveName);
      await this.db.query(`INSERT INTO move_nickname(nickname, move, "character") VALUES ($1, $2, 'all')`, [nickname, moveName]);

      await channel.send(`추가 완료! 이제 무브셋 이름 ${splited[2]} -> ${moveName}로 인식합니다.`);
    } catch (e) {
      console.log(e);
      if (e.code === '23505') {
        await channel.send(`약어 추가에 실패하였습니다. 이미 존재하는 약어입니다.`);
      }
    }
  }

  async runAddCharacterMoveNicknameCommand() {
    const channel = this.msg.channel;
    const splited = this.msg.content.split(' ');

    const charName = (await DBUtil.getTranslatedCharacterName(this.db, splited[2].toLowerCase())).toLowerCase();
    const nickname = splited[3].toLowerCase();
    const isCharacterMove = await DBUtil.isCharacterMoveNicknameInDB(this.db, splited[4].toLowerCase(), charName);
    const moveName = isCharacterMove ? (await DBUtil.getTranslatedCharacterMoveName(this.db, splited[4].toLowerCase(), charName)).toLowerCase()
                                     : (await DBUtil.getTranslatedMoveName(this.db, splited[4].toLowerCase())).toLowerCase();

    try {
      // console.log(nickname, moveName);
      await this.db.query(`INSERT INTO move_nickname(nickname, move, "character") VALUES ($1, $2, $3)`, [nickname, moveName, charName]);

      await channel.send(`추가 완료! 이제 캐릭터 ${charName}에 한하여 무브셋 이름 ${splited[3]} -> ${moveName}로 인식합니다.`);
    } catch (e) {
      console.log(e);
      if (e.code === '23505') {
        await channel.send(`약어 추가에 실패하였습니다. 이미 존재하는 약어입니다.`);
      }
    }
  }
}

class BotRemoveNicknameCommand extends BotCommand {
  constructor(bot, db, msg) {
    super(bot, db, msg);
  }

  async run() {
    const channel = this.msg.channel;
    const splited = this.msg.content.split(' ');
    if (!(splited.length == 3 && (splited[1] == '캐릭터' || splited[1] == '무브셋'))
        && !(splited.length == 4 && splited[1] == '고유무브셋')) {
      await channel.send(`명령어 규약이 맞지 않습니다. 다음 규약을 맞춰서 입력해주세요. (약어와 이름에 공백은 있으면 안됩니다.)
\`\`\`?약어제거 캐릭터 제거할약어\`\`\`
or
\`\`\`?약어제거 무브셋 제거할약어\`\`\`
or
\`\`\`?약어제거 고유무브셋 캐릭터(약어) 제거할약어\`\`\``);
      return;
    }

    if (splited[1] == '캐릭터') {
      await this.runRemoveCharacterNicknameCommand();
    } else if (splited[1] == '무브셋') {
      await this.runRemoveMoveNicknameCommand();
    } else if (splited[1] == '고유무브셋') {
      await this.runRemoveCharacterMoveNicknameCommand();
    }
  }

  async runRemoveCharacterNicknameCommand() {
    const channel = this.msg.channel;
    const splited = this.msg.content.split(' ');
    const nickname = splited[2].toLowerCase();

    if (!(await DBUtil.isCharacterNicknameInDB(this.db, nickname))) {
      await channel.send(`존재하지 않는 약어입니다.`);
      return;
    }

    try {
      await this.db.query(`DELETE FROM character_nickname WHERE nickname = ($1)`, [nickname]);

      await channel.send(`제거 완료!`);
    } catch (e) {
      console.log(e);
    }
  }

  async runRemoveMoveNicknameCommand() {
    const channel = this.msg.channel;
    const splited = this.msg.content.split(' ');
    const nickname = splited[2].toLowerCase();

    if (!(await DBUtil.isMoveNicknameInDB(this.db,nickname))) {
      await channel.send(`존재하지 않는 약어입니다.`);
      return;
    }

    try {
      await this.db.query(`DELETE FROM move_nickname WHERE nickname = ($1)`, [nickname]);

      await channel.send(`제거 완료!`);
    } catch (e) {
      console.log(e);
    }
  }

  async runRemoveCharacterMoveNicknameCommand() {
    const channel = this.msg.channel;
    const splited = this.msg.content.split(' ');

    const charName = (await DBUtil.getTranslatedCharacterName(this.db, splited[2].toLowerCase())).toLowerCase();
    const nickname = splited[3].toLowerCase();

    if (!(await DBUtil.isCharacterMoveNicknameInDB(this.db, nickname, charName))) {
      await channel.send(`존재하지 않는 약어입니다.`);
      return;
    }

    try {
      await this.db.query(`DELETE FROM move_nickname WHERE nickname = ($1) AND "character" = ($2)`, [nickname, charName]);

      await channel.send(`제거 완료!`);
    } catch (e) {
      console.log(e);
    }
  }
}

class BotDingDongCommand extends BotCommand {
  constructor(bot, db, msg) {
    super(bot, db, msg);
  }

  async run() {
    const channel = this.msg.channel;
    const splited = this.msg.content.split(' ');
    const nickname = splited[1].toLowerCase();

    if (!(splited.length == 2)) {
      await channel.send(`명령어 규약이 맞지 않습니다. 다음 규약을 맞춰서 입력해주세요. (약어와 이름에 공백은 있으면 안됩니다.)
\`\`\`?딩동 캐릭터\`\`\``);
      return;
    }

    if (!(await DBUtil.isCharacterNicknameInDB(this.db, nickname))) {
      await channel.send(`존재하지 않는 약어입니다.`);
      return;
    }

    const capitalize = s => s && s[0].toUpperCase() + s.slice(1);
    const charName = (await DBUtil.getTranslatedCharacterName(this.db, nickname)).toLowerCase();
    const embedDingDongMessage = this.createEmbedDingDongMessage(capitalize(charName), allCharacterDingDongData[charName]);

    await channel.send({ embeds: [embedDingDongMessage] });
  }

  createEmbedDingDongMessage(charName, charDingDongData) {
    const embedDingDongMessageFields = {
      title: `${charName}`,
      fields: [
        {
          name: 'Percentage',
          value: `[${charDingDongData['optimized']}] ${charDingDongData['minimum']} - ${charDingDongData['maximum']}` || '-',
        },
        {
          name: 'Optimized',
          value: `${charDingDongData['optimized']}` || '-',
        },
        {
          name: 'Minimum',
          value: `${charDingDongData['minimum']}` || '-',
        },
        {
          name: 'Maximum',
          value: `${charDingDongData['maximum']}` || '-',
        },
        {
          name: 'Dtilt Low',
          value: `${charDingDongData['dtilt_low']}` || '-',
        },
        {
          name: 'Dtilt Max Rage',
          value: `${charDingDongData['dtilt_max_rage']}` || '-',
        },
      ],
      footer: {
        text: `All percents in this box are for PS2 / FD.`,
      },
    }

    return embedDingDongMessageFields;
  }
}

module.exports = {
  FrameBot,
};