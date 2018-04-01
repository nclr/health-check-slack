var fs = require('fs');
var http = require('http');
var https = require('https');
var request = require('request');
var emoji = require('node-emoji')

const {
    IncomingWebhook
} = require('@slack/client');
const url = process.env.SLACK_WEBHOOK_URL;

const webhookurl = "https://hooks.slack.com/services/<some-sort-of-secret-key>";
const webhook = new IncomingWebhook(webhookurl);
var notReachable = {};

/* Read configuration and start loops */
fs.readFile('./config.json', 'utf8', function (err, data) {
    if (err) throw err;
    var conf = JSON.parse(data);
    var urls = conf.urls;

    for (var name in urls) {
        var url = urls[name].url;
        var interval = urls[name].interval;
        createloop(name, url, interval);
    }
});

/* Create a loop that's executed every x milliseconds */
function createloop(name, url, interval) {
    var requestLoop = setInterval(function () {
        request({
            url: url,
            method: "GET",
            timeout: 10000,
            followRedirect: true,
            maxRedirects: 10
        }, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                if (typeof notReachable[name] != "undefined") {
                    delete notReachable[name];
                    var message = name + " " + emoji.get('beers') + " " + getFormattedDate();
                    send(message);
                    console.log(message);
                }
            } else {
		if (typeof notReachable[name] == "undefined") {
                    notReachable[name] = "true";
                    var message = name + " " + emoji.get('hankey')  + " " + getFormattedDate();
                    console.log(message);
                    send(message);
		}
            }
        });
    }, interval);
}

/* Send message to slack incoming webhook */
function send(text) {
    webhook.send(text, function (err, res) {
        if (err) {
            console.log('Error:', err);
        } else {
            console.log('Message sent: ', res);
        }
    });
}

/* Get Timestamp */
function getFormattedDate() {
    var date = new Date();

    var month = date.getMonth() + 1;
    var day = date.getDate();
    var hour = date.getHours();
    var min = date.getMinutes();
    var sec = date.getSeconds();

    month = (month < 10 ? "0" : "") + month;
    day = (day < 10 ? "0" : "") + day;
    hour = (hour < 10 ? "0" : "") + hour;
    min = (min < 10 ? "0" : "") + min;
    sec = (sec < 10 ? "0" : "") + sec;

    var str = '[' + day + "-" + month +  "-" + date.getFullYear()  + "_" +  hour + ":" + min + ":" + sec + ']';

    return str;
}