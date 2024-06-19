// Deprecated
class CommonUtilBot {
  constructor(db, client, allCharacterFrameData) {
    this.db = db;
    this.client = client;
    this.allCharacterFrameData = allCharacterFrameData;
  }

  async isCharacterNicknameInDB(nickname) {
    const res = await this.db.query(
      "SELECT character FROM character_nickname WHERE nickname = ($1)",
      [nickname]
    );

    return res.rows.length > 0;
  }

  async isCharacterMoveNicknameInDB(nickname, charName) {
    const res = await this.db.query(
      "SELECT move FROM move_nickname WHERE nickname = ($1) AND character = ($2)",
      [nickname, charName]
    );

    return res.rows.length > 0;
  }

  async isMoveNicknameInDB(nickname) {
    const res = await this.db.query(
      "SELECT move FROM move_nickname WHERE nickname = ($1)",
      [nickname]
    );

    return res.rows.length > 0;
  }

  async getTranslatedCharacterName(nickname) {
    const res = await this.db.query(
      "SELECT character FROM character_nickname WHERE nickname = ($1)",
      [nickname]
    );

    return res.rows.length > 0 ? res.rows[0]["character"] : nickname;
  }

  async getTranslatedCharacterMoveName(nickname, charName) {
    const res = await this.db.query(
      "SELECT move FROM move_nickname WHERE nickname = ($1) AND character = ($2)",
      [nickname, charName]
    );

    return res.rows.length > 0 ? res.rows[0]["move"] : nickname;
  }

  async getTranslatedMoveName(nickname) {
    const res = await this.db.query(
      "SELECT move FROM move_nickname WHERE nickname = ($1) AND character = 'all'",
      [nickname]
    );

    return res.rows.length > 0 ? res.rows[0]["move"] : nickname;
  }
}

class DBUtil {
  static async isCharacterNicknameInDB(db, nickname) {
    const res = await db.query(
      "SELECT character FROM character_nickname WHERE nickname = ($1)",
      [nickname]
    );

    return res.rows.length > 0;
  }

  static async isCharacterMoveNicknameInDB(db, nickname, charName) {
    const res = await db.query(
      "SELECT move FROM move_nickname WHERE nickname = ($1) AND character = ($2)",
      [nickname, charName]
    );

    return res.rows.length > 0;
  }

  static async isMoveNicknameInDB(db, nickname) {
    const res = await db.query(
      "SELECT move FROM move_nickname WHERE nickname = ($1)",
      [nickname]
    );

    return res.rows.length > 0;
  }

  static async getTranslatedCharacterName(db, nickname) {
    const res = await db.query(
      "SELECT character FROM character_nickname WHERE nickname = ($1)",
      [nickname]
    );

    return res.rows.length > 0 ? res.rows[0]["character"] : nickname;
  }

  static async getTranslatedCharacterMoveName(db, nickname, charName) {
    const res = await db.query(
      "SELECT move FROM move_nickname WHERE nickname = ($1) AND character = ($2)",
      [nickname, charName]
    );

    return res.rows.length > 0 ? res.rows[0]["move"] : nickname;
  }

  static async getTranslatedMoveName(db, nickname) {
    const res = await db.query(
      "SELECT move FROM move_nickname WHERE nickname = ($1) AND character = 'all'",
      [nickname]
    );

    return res.rows.length > 0 ? res.rows[0]["move"] : nickname;
  }
}

module.exports = {
  CommonUtilBot,
  DBUtil,
};
