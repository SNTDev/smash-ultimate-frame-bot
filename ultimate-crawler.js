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
        console.log('Retry...')
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
        url: `https://ultimateframedata.com`,
    });

    const $ = cheerio.load(res.data);

    const names = $('#charList > .charactericon').map((i, e) => {
        return e.attribs.class.replace(/charactericon /g, '');
    });

    //slice 'stats'
    return names.toArray().slice(1);
}

async function scrapCharacterFrames(name) {
    const res = await axios({
        method: 'get',
        url: `https://ultimateframedata.com/${name}.php`,
    });

    const $ = cheerio.load(res.data);

    const charData = {
        name,
    };
    $('.moves > .movecontainer').each((i, e) => {
        const movename = $(e).find('.movename').text().replace(/\([A-Za-z ]*\)/g, '').trim();
        const startup = $(e).find('.startup').text().trim();
        const totalframes = $(e).find('.totalFrames').text().trim();
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

    return charData;
}

async function scrapAll() {
    const names = await scrapCharacterNames();
    const res = {};

    for (let i = 0; i < names.length; i += 5) {
        const slicedNames = names.slice(i, i + 5);
        const charFramesList = await Promise.all(slicedNames.map((e) => scrapCharacterFrames(e)));

        charFramesList.forEach((e) => {
            res[e['name']] = e;
        })

        console.log(`Scrapped ${i + 5}th Character....`);
    }

    fs.writeFileSync('character-frame-data.json', JSON.stringify(res));

    return res;
}

module.exports = {
    scrapAll,
};