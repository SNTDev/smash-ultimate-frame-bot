const { CommonUtilBot } = require('./common');
const puppeteer = require('puppeteer');
const cheerio = require('cheerio');

function isEmptyObject(obj) {
  return !Object.keys(obj).length;
}

class MatchupBot extends CommonUtilBot {
  constructor(db, redis, client, allCharacterFrameData) {
    super(db, client, allCharacterFrameData);
    this.redis = redis;
  }

  async runMatchupCommand(msg) {
    const matchupCommand = new BotMatchupCommand(this, msg);
    await matchupCommand.run();
  }
}

class BotMatchupCommand {
  constructor(bot, msg) {
    this.bot = bot;
    this.msg = msg;
  }

  parseContent(content) {
    const $ = cheerio.load(content);
    const tableHeadList = $(`.MuiTableRow-root.MuiTableRow-head > th > span > div`);
    const breakdownList = $(`.MuiTableRow-root.table-row`);
    const firstCharacterWinMessage = $(tableHeadList[1]).text().replace(' %', '');
    const secondCharacterWinMessage = $(tableHeadList[2]).text().replace(' %', '');
    const firstCharacterName = firstCharacterWinMessage.replace(' Win', '');
    const secondCharacterName = secondCharacterWinMessage.replace(' Win', '');
    const data = [];

    breakdownList.each((i, e) => {
      const firstWinRate = $(e.children[1]).text();
      const secondWinRate = $(e.children[2]).text();
      const totalGames = $(e.children[3]).text()
      data.push({
        name: `${$(e.children[0]).text()} (Total Games: ${totalGames})`,
        value: `${firstWinRate}% : ${secondWinRate}%`,
      })
    });

    return {
      firstCharacterName,
      secondCharacterName,
      data,
    };
  }

  async getDataFromUGD(charName1, charName2) {
    // const data = JSON.parse(await this.bot.redis.get(`${charName1}-${charName2}`));
    // if (!!data) return data;

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox','--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    await page.goto(`https://ultimategamedata.com/matchup/?character1=${charName1}&character2=${charName2}`, {
    });
    const content = await page.content();
    const res = this.parseContent(content);
    page.close();
    browser.close();
    
    if(res.data.legnth === 0) throw new Error(res);

    // await this.bot.redis.set(`${charName1}-${charName2}`, JSON.stringify(res), {EX: 60 * 60 * 24 * 30});
    return res;
  }

  createEmbedFrameMessage(result) {
    const { firstCharacterName, secondCharacterName } = result;
    const embedFrameMessageFields = {
      title: `${firstCharacterName} vs ${secondCharacterName}`,
      fields: result.data,
      footer: {
        text: `Reference: https://ultimategamedata.com/`,
      },
    }

    return embedFrameMessageFields;
  }

  async run() {
    const channel = this.msg.channel;
    const splited = this.msg.content.split(' ');
    if (splited.length != 3) {
      await channel.send(`명령어 규약이 맞지 않습니다. 다음 규약을 맞춰서 입력해주세요.
\`\`\`?맵별승률 캐릭터1(약어) 캐릭터2(약어)\`\`\``);
      return;
    }

    try{
      let charName1 = (await this.bot.getTranslatedCharacterName(splited[1].toLowerCase())).toLowerCase();
      let charName2 = (await this.bot.getTranslatedCharacterName(splited[2].toLowerCase())).toLowerCase();

      if (charName1 == 'minmin') charName1 = 'min_min';
      if (charName2 == 'minmin') charName2 = 'min_min';

      const gameResult = await this.getDataFromUGD(charName1, charName2);

      const embedFrameData = this.createEmbedFrameMessage(gameResult);
      await channel.send({ embeds: [embedFrameData] });
    } catch(e) {
      console.log(e);
      await channel.send(`캐릭터를 찾을 수 없습니다.`);
    }
  }
}

module.exports = {
  MatchupBot,
};