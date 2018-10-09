// http://ejohn.org/blog/ecmascript-5-strict-mode-json-and-more/
"use strict";

// Optional. You will see this name in eg. 'ps' or 'top' command
process.title = 'jeep-demo';

// Port where we'll run the websocket server
var webSocketsServerPort = 9000;

// websocket and http servers
var webSocketServer = require('websocket').server;
var http = require('http');

/**
* HTTP server
*/
var server = http.createServer(function(request, response) {
  // Not important for us. We're writing WebSocket server, not HTTP server
});
server.listen(webSocketsServerPort, function() {
  console.log((new Date()) + " Server is listening on port " + webSocketsServerPort);
});

var wsServer = new webSocketServer({
  // WebSocket server is tied to a HTTP server. WebSocket request is just
  // an enhanced HTTP request. For more info http://tools.ietf.org/html/rfc6455#page-6
  httpServer: server
});


/**
* Global variables
*/
// list of currently connected clients (users)
var clients = [ ];
var clientsBusCCAN  = [ ];
var clientsBusBCAN  = [ ];
var clientsBusICAN  = [ ];
var clientsBusLIN   = [ ];
var clientsBusKLINE = [ ];

/**
* Helper function for escaping input strings
*/
function htmlEntities(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function removeAllProbes(ind) {
  var busIndex;
  busIndex = clientsBusCCAN.indexOf(ind);
  if(busIndex != -1) {
    clientsBusCCAN.splice(busIndex,1);
    return;
  }

  busIndex = clientsBusBCAN.indexOf(ind);
  if(busIndex != -1) {
    clientsBusBCAN.splice(busIndex,1);
    return;
  }

  busIndex = clientsBusLIN.indexOf(ind);
  if(busIndex != -1) {
    clientsBusLIN.splice(busIndex,1);
    return;
  }

  busIndex = clientsBusICAN.indexOf(ind);
  if(busIndex != -1) {
    clientsBusICAN.splice(busIndex,1);
    return;
  }

  busIndex = clientsBusKLINE.indexOf(ind);
  if(busIndex != -1) {
    clientsBusKLINE.splice(busIndex,1);
    return;
  }

  console.log("Removed all probes for client " + ind);
}

function processRxMesg(index, message) {
  if (message.type === 'utf8') { // accept only text
    console.log("Received: " + message.utf8Data);
    try {
      var rxMessage = JSON.parse(message.utf8Data);
    } catch (e) {
      console.log('This doesn\'t look like a valid JSON: ', message.utf8Data);
      return;
    }

    if (rxMessage.type === 'code') { // first response from the server with user's color
      console.log("Received code: " + rxMessage.data);
    } else if (rxMessage.type === 'probeon') {
      console.log("Client: " + index + " Probe added: " + rxMessage.data);
      removeAllProbes(index);
      switch(rxMessage.data) {
        case 'busCCAN':
          clientsBusCCAN.push(index);
          break;
        case 'busLIN':
          clientsBusLIN.push(index);
          break;
        case 'busBCAN':
          clientsBusBCAN.push(index);
          break;
        default:
          console.log("Bus: " + rxMessage.data + " not found");
      }
      console.log(clientsBusCCAN + clientsBusLIN + clientsBusBCAN);
    } else if (rxMessage.type === 'probeoff') {
      console.log("Client: " + index + " Probe removed: " + rxMessage.data);
      removeAllProbes(index);
    }
  }
}

/**
* WebSocket server
*/
// This callback function is called every time someone
// tries to connect to the WebSocket server
wsServer.on('request', function(request) {
  console.log((new Date()) + ' Connection from origin ' + request.origin + '.');

  // accept connection - you should check 'request.origin' to make sure that
  // client is connecting from your website
  // (http://en.wikipedia.org/wiki/Same_origin_policy)
  var connection = request.accept(null, request.origin);
  // we need to know client index to remove them on 'close' event
  var index = clients.push(connection) - 1;
  var userName = false;
  var userColor = false;

  console.log((new Date()) + ' Connection accepted.');

  // user sent some message
  connection.on('message', function(message) {
    processRxMesg(index, message);
  });

//   if (userName === false) { // first message sent by user is their name
//     // remember user name
//     userName = htmlEntities(message.utf8Data);
//     // get random color and send it back to the user
//     userColor = colors.shift();
//     connection.sendUTF(JSON.stringify({ type:'color', data: userColor }));
//     console.log((new Date()) + ' User is known as: ' + userName
//     + ' with ' + userColor + ' color.');
//
//   } else { // log and broadcast the message
//     console.log((new Date()) + ' Received Message from '
//     + userName + ': ' + message.utf8Data);
//
//     // we want to keep history of all sent messages
//     var obj = {
//       time: (new Date()).getTime(),
//       text: htmlEntities(message.utf8Data),
//       author: userName,
//       color: userColor
//     };
//     history.push(obj);
//     history = history.slice(-100);
//
//     // broadcast message to all connected clients
//     var json = JSON.stringify({ type:'message', data: obj });
//     for (var i=0; i < clients.length; i++) {
//       clients[i].sendUTF(json);
//     }
//   }
// }
// });

// user disconnected
connection.on('close', function(connection) {
  console.log((new Date()) + " Peer "
  + connection.remoteAddress + " with client index " + index + " disconnected.");
  removeAllProbes(index);
  clients.splice(index, 1);
});

});

var busCCANContents = [ ];

function sendBusCCAN() {
//  console.log('Sending CAN-H bus' );
//  console.log(busCCANContents);

  for (var i=0; i < clientsBusCCAN.length; i++) {
      clients[clientsBusCCAN[i]].sendUTF(JSON.stringify({ type:'busMessage', data: busCCANContents }));
  }

  busCCANContents = [ ];
}
setInterval(sendBusCCAN, 1500);

setInterval(function () {
  busCCANContents.push({
      time: (new Date()).getTime(),
      text: 'message 1 content ' + Math.random().toString(16).slice(2),
      author: 'message1',
      color: 'blue'
  });
}, 500);
