# hubot-xmatters

A hubot script to send events to xMatters and listen for callbacks.

See [`src/xmatters.js`](src/xmatters.js) for code documentation. For full installation instructions and the Communication Plan, head over [here](https://support.xmatters.com/hc/en-us/articles/206271755). 

## Installation
### Hubot
In hubot project repo, run:

`npm install hubot-xmatters --save`

Then add **hubot-xmatters** to your `external-scripts.json`, for example:

```json
[
  "hubot-xmatters"
]
```

### xMatters
1. Download the Hubot Communications Plan from the xMatters website [here](https://support.xmatters.com/hc/en-us/articles/206271755)
2. Create a new REST Web Service User
3. Set the credentials in the appropriate environment variables:

**EXPRESS_PORT** - The port hubot will listen on for callbacks from xMatters
**EXPRESS_USER** - Username for basic authentication from xMatters
**EXPRESS_PASSWORD** - Password for basic authentication from xMatters
**EXPRESS_ADDRESS** - Hostname and protocol for xMatters to make callbacks

**XMATTERS_REST_USERNAME** - Username of the user to authenticate to xMatters
**XMATTERS_REST_PASSWORD** - Password of the user to authenticate to xMatters
**XMATTERS_URL** - The xMatters web service URL endpoint for sending events (retrieved from the form, as explained above).

Per hubot standard startup, these are generally set as environment variables when the bot is started. For example:

`EXPRESS_PORT=8080 EXPRESS_USER="xMatters" EXPRESS_PASSWORD="xMatters" EXPRESS_ADDRESS="http://myhubothost.company.com" XMATTERS_REST_USERNAME="xBot" XMATTERS_REST_PASSWORD="xBot" XMATTERS_URL="https://instance.dc.xmatters.com/reapi/2015-04-01/forms/UUID-HERE/triggers" HUBOT_SLACK_TOKEN=slack-token-here ./bin/hubot --adapter slack`



## Usage
Once hubot is logged in, several new commands will be available. Note that in both of these commands, the second parameter must be enclosed in "s.
1. `hubot send event "<groups|users>" <message>` - Send an event to a list of users or groups comma separated with a message
2. `hubot send event "all" <message>` - Send an event to all users in the channel/room. Note that the slack names need to match the xMatters usernames

## Sample Interaction

```
tdepuy>> hubot send event "Database,tdepuy" The server room is on fire! Save the DB!
hubot>> Event "1360008" created!
hubot>> xM Event 1360008: has a status of active
hubot>> xM Event 1360008: Delivered Work Phone to tdepuy
hubot>> xM Event 1360008: tdepuy responded "Ack" on Work Email
```

