// Description:
//   Send events to xMatters to send voice calls, sms, emails and mobile push messages to users or groups.
//
// Dependencies:
//   "<module name>": "<module version>"
//
// Configuration:
//
// EXPRESS_PORT - The port hubot will listen on for callbacks from xMatters
// EXPRESS_USER - Username for basic authentication from xMatters
// EXPRESS_PASSWORD - Password for basic authentication from xMatters
// EXPRESS_ADDRESS - Hostname and protocol for xMatters to make callbacks
//
// XMATTERS_REST_USERNAME - Username of the user to authenticate to xMatters
// XMATTERS_REST_PASSWORD - Password of the user to authenticate to xMatters
// XMATTERS_URL - The xMatters Web Service endpoint for sending events
//
// Commands:
//   hubot send event "<groups|users>" <message> - Send an event to a list of users or groups comma separated with a message
//   hubot send event "all" <message> - Send an event to all users in the channel/room. Note that the slack names need to match the xMatters usernames
//
// Notes:
//  This will require the Hubot Communications Plan available on the xMatters support website: https://support.xmatters.com. For troubleshooting issues, set the `HUBOT_LOG_LEVEL` to "debug" to see more information about the communications to and from xMatters.
//
// Author:
//  xMTinkerer
   
var util = require('util');

var CALLBACK_PORT      = process.env.EXPRESS_PORT || process.env.PORT || 8080;
var CALLBACK_USERNAME  = process.env.EXPRESS_USER     || 'xMatters';
var CALLBACK_PASSWORD  = process.env.EXPRESS_PASSWORD || 'xMatters';
var CALLBACK_ADDRESS    = process.env.EXPRESS_ADDRESS || 'localhost';

var XM_USER = process.env.XMATTERS_REST_USERNAME || "xBot";
var XM_PASS = process.env.XMATTERS_REST_PASSWORD || "xBot";
var XM_URL  = process.env.XMATTERS_URL;
   
    
var CALLBACK_URL = CALLBACK_ADDRESS + ":" + CALLBACK_PORT + "/hubot/listener"; 

module.exports = function( robot ) {
 
  // Hear the send event commands 
  //   hubot send event "<groups|users>" <message> - Send an event to a list of users or groups comma separated with a message
  //   hubot send event "all" <message> - Send an event to all users in the channel/room. Note that the slack names need to match the xMatters usernames
  robot.hear( /send event "(all|[\w\d\s,\.]*)" (.*)/, function( msg ) {
    robot.logger.info( 'MSG: ' + msg.match );
   
    // Callback configuration
    // The code will look for each of these and add the callback to the event.
    // Remove the callbacks that are not desired. 
    callbacks = ['response', 'deliveryStatus', 'status' ];
   
   
    // Get the credentials and endpoint straightened out
    auth = 'Basic ' + new Buffer( XM_USER + ':' + XM_PASS ).toString('base64');
   
    // Determine the recipients.
    // For 'all' get the users from the brain. Note that usernames here should match the xMatters Usernames
    // Otherwise, split on a , and trim whitespace.
    var recipients = [];
    recipientsJSON = [];
   
    if( msg.match[1] === 'all' ) {
        users = robot.brain.users();
       for( u in users )
           recipients.push( users[u].name );
    }
    else
        recipients = msg.match[1].split( ',' );
   
    // Now generate the recipients JSON
    for( i in recipients ) {
        recipientsJSON.push( { "targetName" : recipients[i].trim() } );
    }
   
   
    // Generate the callbacks telling xM where to send the payload
    // as well as what type and authentication information. 
    callbacksJSON = [];
    if( callbacks.indexOf( 'status' ) > -1 )
         callbacksJSON.push( {
            "url": CALLBACK_URL + '?type=status',
            "type": "status",
            "authType": "basic",
            "authUserName": CALLBACK_USERNAME,
            "authPassword": CALLBACK_PASSWORD
        });
       
    if( callbacks.indexOf( 'deliveryStatus' ) > -1 )
         callbacksJSON.push( {
            "url": CALLBACK_URL + '?type=deliveryStatus',
            "type": "deliveryStatus",
            "authType": "basic",
            "authUserName": CALLBACK_USERNAME,
            "authPassword": CALLBACK_PASSWORD
        } );
       
    if( callbacks.indexOf( 'response' ) > -1 )
         callbacksJSON.push( {
            "url": CALLBACK_URL + '?type=response',
            "type": "response",
            "authType": "basic",
            "authUserName": CALLBACK_USERNAME,
            "authPassword": CALLBACK_PASSWORD
        } );
   
    
    // Assemble the payload. 
    var data = {
      "properties" : {
        "Message": msg.match[2].substr( 0, 1999 ),
        "Room": msg.envelope.room
      },
      "callbacks" : callbacksJSON,
      "recipients" : recipientsJSON
    };
   
    robot.logger.debug( 'PAYLOAD: ' + JSON.stringify( data ) );
   
    // Make the HTTP call to xMatters
    msg.http( XM_URL )
       .headers( {
          "Authorization": auth,
          "Content-Type": 'application/json',
          "Accept": "application/json"
        })
       .post( JSON.stringify( data ) ) (function( err, res, body ) {
        
          //
          if( err ) {
            msg.send( 'Uh oh, something went wrong. See the logs for details' );
            robot.logger.error( 'ERR: ' + err );
            return;
          }
          
          robot.logger.debug( 'Response Body: ' + body );
          
          bodyJSON = JSON.parse( body );
          
          if( !bodyJSON.id ) {
              robot.logger.error( 'ERROR: ' + body );
              msg.send( 'Uh oh: ' + bodyJSON.message + '. ' + ( bodyJSON.details || '') );
              return;
          }
          
         msg.send( 'Event "' + bodyJSON.id + '" created!' );
      });
  });
 
 
  // This is the callback listener and is reachable from the CALLBACK_URL variable
  robot.router.post( '/hubot/listener', function( req, res ) {
      robot.logger.debug( 'req.query: ' + util.inspect( req.query ) );
      robot.logger.debug( 'req.body:  ' + util.inspect( req.body ) );
     
      var type = req.query.type;
     
      var bodyJSON = req.body;
     
      var room = '';

      // The eventProperties come over as an array of objects:
      // eventProperties: [ {"name1":"value1", "name2":"value2"}]
      // so we have to loop through and find the "Room" property
      var eventProperties = bodyJSON.eventProperties;
      for( k in eventProperties )
          if( eventProperties[k].Room != null )
              room = eventProperties[k].Room;
     
      robot.logger.debug( 'ROOM: ' + room );
     
      // We should prefix the messages with the xM Event and ID. 
      // Maybe this should be a parameter?
      var msgText = 'xM Event ' + bodyJSON.eventIdentifier + ': ';
      if( type === 'status' ) {
          msgText += 'has a status of ' + bodyJSON.status;
      }
      else if( type === 'deliveryStatus' ) {
          if( bodyJSON.deliveryStatus == 'Failed' )
            msgText += bodyJSON.deliveryStatus + ' sending to ' + bodyJSON.recipient;
          
          else
            msgText += bodyJSON.deliveryStatus + ' on ' + bodyJSON.device + ' to ' + bodyJSON.recipient;
      }
      else if( type === 'response' ) {
          msgText += bodyJSON.recipient + ' responded "' + bodyJSON.response + '" on ' + bodyJSON.device
          if( bodyJSON.annotation != null )
              msgText += ': ' + bodyJSON.annotation
      }
      else {
          robot.logger.error( 'Incorrect callback type "' + type + '". ' );
          res.send( 'OK' );
          return;
      }
      
      // Finally, send the message to the "room"
      robot.messageRoom( room, msgText );
      res.send( 'OK' );
     
  });
 
 
}

