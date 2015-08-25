# hubot-xmatters

A hubot script to send events to xMatters and listen for callbacks.

See [`src/xmatters.js`](src/xmatters.js) for full documentation.

## Installation
### Hubot
In hubot project repo, run:

`npm install hubot-xmatters --save`

Then add **hubot-xmatters** to your `external-scripts.json`:

```json
[
  "hubot-xmatters"
]
```

### xMatters
1. Download the Hubot Communications Plan from the xMatters website [here](https://support.xmatters.com/hc/)
2. Create a new REST Web Service User

## Usage
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

