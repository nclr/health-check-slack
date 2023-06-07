var fs = require('fs');
var request = require("request");

const UrlStatus = {
    Up: 'Up',
    Pending: 'Pending',
    StillDown: 'StillDown',
};

Object.freeze(UrlStatus);

const dateTimeFormat = new Intl.DateTimeFormat("en-GB", {
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric",
});

const webhookUrl = process.env.SLACK_WEBHOOK_URL;
const urlContainer = {};
const urlErrorContainer = {};

/* Read configuration and start loops */
fs.readFile('./config.json', 'utf8', function (err, data) {
    if (err) throw err;
    const conf = JSON.parse(data);
    const urls = conf.urls;

    for (const [name, params] of Object.entries(urls)) {
        createLoop(name, params);
    }
});

/* Create a loop that's executed every x milliseconds */
function createLoop(name, params) {
    const dateBounds = {
        minTimeOfDay: params.minTimeOfDay,
        maxTimeOfDay: params.maxTimeOfDay,
        daysOfTheWeek: params.daysOfTheWeek
    }

    const defaultRequestConfig = {
        timeout: 10000,
        followRedirect: true,
        maxRedirects: 10
    };

    setInterval(function () {
        const requestDate = new Date();

        if (!isDateWithinBounds(requestDate, dateBounds)) {
            urlContainer[name] = undefined;
            return;
        }

        const requestConfig = {
            ...defaultRequestConfig,
            ...params.requestConfig,
            url: params.url
        };

        request.get(requestConfig, function (error, response, body) {
            const responseDate = new Date();
''
            if (error !== null) {
                handleLocalError(name, responseDate);
            } else if (response.statusCode === 200) {
                handleSuccessStatus(name, params, responseDate);
            } else {
                handleDownStatus(name, params, responseDate);
            }
        });
    }, params.interval);
}

function handleSuccessStatus(urlName, params, responseDate) {
    if (urlContainer[urlName] === undefined) {
        const message = "First check of this session... Endpoint is running! :beer:";
        send(message);
        console.log(`${dateTimeFormat.format(responseDate)} - ${message}`);
    } else {
        if (urlErrorContainer[urlName] !== undefined) {
            restoreLocalErrorAndSend(responseDate, urlName, params.localErrorReportThreshold);
        }

        if (urlContainer[urlName] !== UrlStatus.Up) {
            const message = `:globe_with_meridians: ${urlName} (${params.urlValue}) is up and running!`;
            send(message);
            console.log(`${dateTimeFormat.format(responseDate)} - ${message}`);
        }
    }

    urlContainer[urlName] = UrlStatus.Up;
}

function handleLocalError(urlName, responseDate) {
    console.error('Local error, couldn\'t reach endpoint.');

    if (urlErrorContainer[urlName] === undefined) {
        urlErrorContainer[urlName] = responseDate;
    }
}

function handleDownStatus(urlName, params, responseDate) {
    const trailingMentions = buildMentionsForDownStatus(params.mentionsWhenDown);
    const message = `:warning: Oh no! It looks like ${urlName} (${params.url}) is down.\n${trailingMentions}`;
    console.log(`${dateTimeFormat.format(responseDate)} - ${message}`);

    if (urlContainer[urlName] === undefined) {
        send("First check of this session... Endpoint didn't respond :confused:");
        urlContainer[urlName] = UrlStatus.Pending;
        return;
    }

    if (urlErrorContainer[urlName] !== undefined) {
        restoreLocalErrorAndSend(responseDate, urlName);
    }

    if (urlContainer[urlName] === UrlStatus.Up) {
        // First fail! Try again, maybe this was temporary.
        urlContainer[urlName] = UrlStatus.Pending;
    } else if (urlContainer[urlName] === UrlStatus.Pending) {
        // Two fails in a row! Send message, the endpoint is down.
        urlContainer[urlName] = UrlStatus.Down;
        send(message);
    }
}

function buildMentionsForDownStatus(mentions) {
    if (mentions === undefined) return '';

    return mentions.reduce((total, mention, index) => {
        if (mention.user === undefined || mention.group === undefined) return total;

        const leadingText = (index === 0) ? 'cc: ' : ', ';
        const trailingText = (mention.user) ? `<@${mention.group}>` : `<!subteam^${mention.group}>`;

        return `${total}${leadingText}${trailingText}`
    }, '');
}

/* Send message to slack incoming webhook */
function send(text) {
    console.log(webhookUrl);
    request.post(
        webhookUrl,
        {
            json: { text: text }
        },
        function (err, res) {
            if (err) {
                console.error(err);
            } else {
                console.log(`Message sent: ${res}`);
            }
        }
    );
}

function restoreLocalErrorAndSend(currentDate, urlName, localErrorReportThreshold) {
    const localErrorSince = urlErrorContainer[urlName];

    if (localErrorSince === undefined) return;

    const reportThreshold = localErrorReportThreshold || 60000;

    const durationInLocalError = dateTimeFormat.formatRange(
      currentDate,
      localErrorSince
    );

    const hasBeenMoreThanOneMinute = durationInLocalError.asMilliseconds() > reportThreshold;

    if (hasBeenMoreThanOneMinute) {
        const formattedDuration = durationInLocalError.format('hh:mm:ss');
        const message = `Health-check was off for ${formattedDuration}.`;
        send(message);
    }

    urlErrorContainer[urlName] = undefined;
}

const parseTimeRe = /^(\d|[0-1]\d|2[0-3]):([0-5]\d)\s*(|am|pm)$/i;

function parseTime(str) {
    const match = parseTimeRe.exec(str);
    if (!match) {
        return undefined;
    }
    const offset = match[3].toLowerCase() === 'pm' ? 12 : 0;
    return [parseInt(match[1], 10) + offset, parseInt(match[2], 10)];
}

const daysOfTheWeek = [
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
    'sunday'
];

function areArrayMembersLessOrEqual(a, b) {
    return a.every(function (value, index) {
        return value <= b[index];
    });
}

function isDateWithinBounds(date, bounds) {
    const currentTimeOfDay = [date.getHours(), date.getMinutes()];
    const minTimeOfDay = parseTime(bounds.minTimeOfDay);
    const maxTimeOfDay = parseTime(bounds.maxTimeOfDay);

    if (minTimeOfDay && !areArrayMembersLessOrEqual(minTimeOfDay, currentTimeOfDay)) return false;
    if (maxTimeOfDay && !areArrayMembersLessOrEqual(currentTimeOfDay, maxTimeOfDay)) return false;

    const dayOfTheWeek = daysOfTheWeek[date.getDay().toLowerCase()];

    if (
        bounds.daysOfTheWeek &&
        !bounds.daysOfTheWeek.some((value) => value.toLowerCase() === dayOfTheWeek.slice(0, value.length))
    ) return false;

    return true;
}
