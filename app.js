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

// Connect to the device
console.log("connecting to your device...");
/*
const xapi = jsxapi.connect(process.env.JSXAPI_DEVICE_URL, {
    username: process.env.JSXAPI_USERNAME,
   password: password
});
*/

const xapi = jsxapi.connect('ssh://192.168.1.32', {
    username: 'tyler',
    password: 'tyler'
});

xapi.on('error', (err) => {
    console.error(`connexion failed: ${err}, exiting`);
    process.exit(1);
});
xapi.on('ready', () => {
    console.log("connexion successful");
});


//socket IO connections
io.on('connection', function(socket){
  
console.log("outside of xapi feedback");
  
//io.emit('newCall', 'outside of feedback')
// Listen to call events
		xapi.feedback
		    .on('/Status/Call', (call) => {
		    	console.log('inside of xapi feedback');
                console.log(call);
		    	 io.emit('newCall', call);
		        /*switch (call.Status) {
		            case "Ringing":
		            	 console.log('Ringing');
		                 io.emit('ringing',{
					    	Direction: call.Direction,
					    	From: call.DisplayName
					    });
		                return;

		            case "Connected":
		                console.log(`Connected call: ${call.id}`);
		                 
		                return;
		            
		            case "Disconnecting":
		                console.log(`Disconnecting call: ${call.id}`);
		                return;

		            case "Idle":
		                console.log(`Idle call: ${call.id}`);
		                return;

		            default:
		                //console.log("DEBUG: ignoring event");
		                return;
		        }*/
		    });

        xapi.feedback
            .on('/Status/Audio/Microphones/Mute', (mute) => {
                io.emit('muteStatus', mute);
            });        

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
});


//Serve pages
app.get('/', function (req, res) {
    res.sendFile('dialPad.html', { root: __dirname });
});

app.post('/dial', function (req, res) {
    var dialString = req.body.dialString;
    xapi.command('Dial', { Number: dialString })
        .then((call) => {
            console.log(`Started call with status: ${call.status}, id: ${call.CallId}`);
            
            

           



 

           

            // Stop call after delay
            /*const delay = 60;
            setTimeout(() => {
                console.log('Disconnecting call, and exiting.');

                xapi.command('Call Disconnect', { CallId: call.CallId })
                    .then(process.exit);
            }, delay * 1000);
            console.log(`Call with be disconnected in ${delay} seconds...`);*/

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