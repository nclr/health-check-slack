var fs = require('fs');
var http = require('http');
var https = require('https');
var request = require('request');

const {
    IncomingWebhook
} = require('@slack/client');
const url = process.env.SLACK_WEBHOOK_URL;
const webhook = new IncomingWebhook(webhookurl);

const webhookurl = "https://hooks.slack.com/services/<some-sort-of-secret-key>";
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
                    var message = name + " is reachable again!";
                    send(message);
                    console.log(message);
                }
            } else {
                notReachable[name] = "true";
                var message = name + ' is not reachable! ';
                console.log(message);
                send(message);
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