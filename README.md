# health-check-slack 🤖

Simple Node app to do health checks on 1 or more urls and send notifications to a slack channel

## Install :star2::package:

cd health-check-slack
npm install

# Usage :sparkles::rocket:

## Configuration

Run the following command:

```sh
cp config.json.example config.json
```

After that, edit the `config.json` file to your liking. The only required fields are:

- url
- interval

All other fields are optional. There are some optional fields you might find useful:

- minTimeOfDay
  - Only ping the server if current time of day is more than this
  - Example: `"06:30"`
- maxTimeOfDay
  - Only ping the server if current time of day is less than this
  - Example: `"21:45"`
- daysOfTheWeek
  - Only ping the server if current day of the week is between the ones specified in the array
  - First letter should be capitalized
  - Example: `["Monday", "Thursday", "Friday"]`
- mentionsWhenDown
  - Every time the server is reported as down, ping these people on Slack
  - Can be a user or a group
  - Examples: `{ "user": "U024BE7LH" }`, `{ "group": "SAZ94GDB8" }`
- requestConfig (see `request(options, callback)` at https://github.com/request/request for more info)
  - timeout
    - Timeout value for the ping
    - Default: 10000
  - followRedirect
    - Allow redirects when pinging
    - Default: true
  - maxRedirects:
    - How many times the request can be redirected before it's considered as failure
    - Default: 10
 The date fields and mention field
are all optional, the only required ones are `url` and `interval`.

## Incoming Webhooks

If you haven't created an app in Slacks interface, do that now: https://api.slack.com/apps
Give it a name and set it up according to your liking. Then, in your app page, go to the
`Incoming Webhooks` section and create a webhook for it (choose your desired channel there).

## .env

Run the following command:

```sh
cp .env.example .env
```

In the new `.env` file, replace the value with the new webhook URL you just created.

-----------

You're good to go! Just run `npm run start` and enjoy (you should probably deploy this to a server =p)

# Error Handling
When a 404 status code incurs it sends "LinkName is not reachable!" and when the error with the specified link is resolved (and a 200 status code is returned) it automatically responds with "LinkName is reachable again!". Every "fail" notification requires at least two failed attempts in a row to reach the desired URL. This minimizes the possibility of some temporary connection problem on the health-check server masqueraded as a URL problem.
