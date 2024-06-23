const fs = require('fs');

const { DBUtil } = require('./common');
const { MessageEmbed } = require('discord.js');

const tierList = fs.existsSync('./tier-list.jpeg') ? fs.readFileSync('./tier-list.jpeg') : null;

class ImageBot {
  constructor(pool) {
    this.pool = pool;
  }

  async runTierListCommand(msg) {
    await msg.channel.send({ files: [tierList] });
  }
}

module.exports = {
  ImageBot,
};