# health-check-slack 🤖
Simple Node app to do health checks on 1 or more urls and send notifications to a slack channel

## Install :star2::package:
git clone https://github.com/nclr/health-check-slack.git  
cd health-check-slack  
npm install  

# Usage :sparkles::rocket:
Simply edit config.json and add the urls to check along with the desired interval (in milliseconds) for each loop like the example below:
```javascript
{
    "urls": {
        "rest service": {
            "url": "https://example.com/app/to/check",
            "interval": "20000"
        },
        "Website": {
            "url": "https://example.com",
            "interval": "3000"
        }
    }
}
```
Then set up an [Incoming Webhook](https://api.slack.com/incoming-webhooks) to one of your slack channels and you're good to go! :wink:

# Error Handling
When a 404 status code incurs it sends "LinkName is not reachable!" and when the error with the specified link is resolved (and a 200 status code is returned) it automatically responds with "LinkName is reachable again!"
