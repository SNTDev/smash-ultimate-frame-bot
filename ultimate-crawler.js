const axios = require('axios');
const sleepRequest = (milliseconds, originalRequest) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => resolve(axios(originalRequest)), milliseconds);
  });
};

axios.interceptors.response.use(response => {
  return response;
}, error => {
  const { config, response: { status } } = error;
  const originalRequest = config;

  if (status === 503) {
    console.log('Retry...');
    return sleepRequest(1000, originalRequest);
  } else {
    return Promise.reject(error);
  }
});
const cheerio = require('cheerio');
const fs = require('fs');

async function scrapCharacterNames() {
  const res = await axios({
    method: 'get',
    url: `https://ultimateframedata.com/smash`,
  });

  const $ = cheerio.load(res.data);

  const names = $('#charList > .charactericon').map((i, e) => {
    return e.attribs.class.replace(/charactericon /g, '');
  });

  //slice 'stats', 'simple and clean'
  return names.toArray().slice(1, names.length - 1);
}

async function scrapCharacterFrames(name) {
  const res = await axios({
    method: 'get',
    url: `https://ultimateframedata.com/${name}`,
  });

  const $ = cheerio.load(res.data);

  const charData = {
    name,
  };
  $('.moves > .movecontainer').each((i, e) => {
    const movename = $(e).find('.movename').not('.input').text().replace(/ /g, '').toLowerCase().trim() != 'neutralairdodge'
                    ? $(e).find('.movename').not('.input').text().replace(/ /g, '').toLowerCase().trim()
                    : 'airdodge,neutral';
    const displayname = $(e).find('.movename').not('.input').text().trim() != 'Neutral Air Dodge'
                        ? $(e).find('.movename').not('.input').text().trim()
                        : 'Air Dodge, Neutral';
    const startup = $(e).find('.startup').text().trim();
    const totalframes = $(e).find('.totalframes').text().trim();
    const landinglag = $(e).find('.landinglag').text().trim();
    const notes = $(e).find('.notes').text().trim();
    const basedamage = $(e).find('.basedamage').text().trim() + '%';
    const shieldlag = $(e).find('.shieldlag').text().trim();
    const shieldstun = $(e).find('.shieldstun').text().trim();
    const advantage = $(e).find('.advantage').text().trim();
    const activeframes = $(e).find('.activeframes').text().trim();
    const hitbox = $(e).find('.hitbox > a').map((_, h) => {
      return `https://ultimateframedata.com/${$(h).attr('data-featherlight')}`;
    }).toArray();

    charData[movename] = {
      movename,
      displayname,
      startup,
      totalframes,
      landinglag,
      notes,
      basedamage,
      shieldlag,
      shieldstun,
      advantage,
      activeframes,
      hitbox,
    }
  });

  // console.log(charData);

  return charData;
}

async function scrapAll() {
  const names = await scrapCharacterNames();
  const res = {};

  for (let i = 0; i < names.length; i += 10) {
    const slicedNames = names.slice(i, i + 10);
    const charFramesList = await Promise.all(slicedNames.map((e) => scrapCharacterFrames(e)));

    charFramesList.forEach((e) => {
      res[e['name']] = e;
    })

    console.log(`Scrapped ${i + 10}th Character....`);
  }

  fs.writeFileSync('character-frame-data.json', JSON.stringify(res));

  return res;
}

async function scrapDingDong() {
  // https://monke.gg/
  // https://monke.gg/percents.json?v=6_6_24
  
  const response = await axios({
    method: 'get',
    url: `https://monke.gg/percents.json?v=6_6_24`,
  });

  const ps2DKOs = {};

  response.data.forEach((e) => {
    let name = e['Name'].toLowerCase().replaceAll(' ', '_').replaceAll('&', 'and');
    ps2DKOs[name] = {};

    // 호카리, 포트
    if (e['Characters'] != '') {
      return;
    }

    const fighterData = ps2DKOs[name];

    fighterData['optimized'] = e.Optimized;
    fighterData['minimum'] = e.Minimum;
    fighterData['maximum'] = e.Maximum;
    fighterData['dtilt_low'] =  e.Dtilt.Low;
    fighterData['dtilt_max_rage'] = e.Dtilt.MaxRage;
    fighterData['apdko_optimized'] = e.apDKO.Optimized;
    fighterData['apdko_minimum'] = e.apDKO.Minimum;
    fighterData['apdko_maximum'] = e.apDKO.Maximum;
  });

  fs.writeFileSync('dko-data.json', JSON.stringify(ps2DKOs));
}

module.exports = {
  scrapAll,
};

scrapDingDong();