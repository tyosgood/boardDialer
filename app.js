const http = require('http');
var express = require('express');

const jsxapi = require('jsxapi');
var path = require('path');

const socketIO = require('socket.io');


var app = express();


var bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

var server = http.createServer(app);
var io = socketIO(server);
// Check args
/*
if (!process.env.JSXAPI_DEVICE_URL || !process.env.JSXAPI_USERNAME) {
    console.log("Please specify info to connect to your device as JSXAPI_URL, JSXAPI_USERNAME, JSXAPI_PASSWORD env variables");
    console.log("Bash example: JSXAPI_DEVICE_URL='ssh://192.168.1.34' JSXAPI_USERNAME='integrator' JSXAPI_PASSWORD='integrator' node example.js");
    process.exit(1);
}
*/

// Empty passwords are supported
//const password = process.env.JSXAPI_PASSWORD ? process.env.JSXAPI_PASSWORD : "";

function connected(xapi, roomName){

// Listen to call events
        xapi.feedback
           .on('/Status/Call', (call) => {
                    console.log('inside of xapi feedback');
                    console.log(call);

                    //Filter the call events that get sent to client
                     if (call.ghost || call.Status == "Ringing" || call.Status == "Connected" || call.Status == "Disconnecting" || call.Status =="Dialling"){ 
                             io.emit('newCall', call);
                     }  
        });

        xapi.feedback
                .on('/Status/Audio/Microphones/Mute', (mute) => {
                    io.emit('muteStatus', mute);
        });        
    
    //socket IO connections
    io.on('connection', function(socket){
    // Join Room corresponding to the specific system
        socket.join(roomName);

    

        socket.on('hangup', function(call){
            console.log('hangup callID: ' + call);
            xapi.command('Call Disconnect', {CallId: call});
        });

        socket.on('mute', function(call){
            console.log('mute callID: ' + call);
            xapi.command('Audio Microphones ToggleMute');
        });

        socket.on('dtmf', function(dtmf){
            console.log('dtmf: ' + dtmf.digit + 'for call: ' + dtmf.callID);
            xapi.command('Call DTMFSend', {CallId: dtmf.callID, DTMFString: dtmf.digit});
        });

        socket.on('answer', function(call){
            xapi.command('Call Accept', {CallId: call});
        });

        socket.on('decline', function(call){
            xapi.command('Call Reject', {CallId: call});
        });
    });
}



// Connect to the device
console.log("connecting to your device...");
/*
const xapi = jsxapi.connect(process.env.JSXAPI_DEVICE_URL, {
    username: process.env.JSXAPI_USERNAME,
   password: password
});
*/
var connectIP = "10.116.116.40";
var IPforRoomName = connectIP.replace(/\./g,'-');

const xapi = jsxapi.connect('ssh://'+ connectIP, {
    username: 'tyler',
    password: 'tyler'
});
xapi.on('error', (err) => {
    console.error(`connexion failed: ${err}, exiting`);
    process.exit(1);
});
xapi.on('ready', () => {
    console.log("connexion to xapi successful, roomname = "+IPforRoomName);
    connected(xapi, IPforRoomName);
});


/*//testing
const secondXapi = jsxapi.connect('ssh://192.168.1.23', {
    username: 'tyler',
    password: 'tyler'
});
secondXapi.on('error', (err) => {
    console.error(`connexion to second xapi failed: ${err}, exiting`);
    process.exit(1);
});
secondXapi.on('ready', () => {
    console.log("connexion to Second Xapi successful");
});*/







//Serve pages
app.get('/', function (req, res) {
    res.sendFile('dialPad.html', { root: __dirname });
});

app.post('/dial', function (req, res) {
    var dialString = req.body.dialString;
    xapi.command('Dial', { Number: dialString })
        .then((call) => {
            console.log(`Started call with status: ${call.status}, id: ${call.CallId}`);
 
        })
        .catch((err) => {
            // Frequent error here is to have several on-going calls
            // reason: "Maximum limit of active calls reached"
            console.error(`Error in call: ${err.message}`)
        });
    
    //res.send(dialString + ' Submitted Successfully!');
});
server.listen(5000, function () {
    console.log('Node server is running..');
});