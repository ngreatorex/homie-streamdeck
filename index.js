const { openStreamDeck } = require('elgato-stream-deck');
const { HomieDevice } = require('@chrispyduck/homie-device');
const path = require('path');
const sharp = require('sharp');

const package = require('./package.json');
const config = require('./config.json');

var myStreamDeck = openStreamDeck();
var serialNumber = myStreamDeck.getSerialNumber();

var homieConfig = {
	"friendlyName": "Homie Stream Deck",
	"name": "streamdeck-"+serialNumber,
	"firmwareName": package.name,
	"firmwareVersion": package.version,
	"mqtt": {
		"client": {
			"host": "localhost",
			"port": 1883
		},
		"base_topic": "homie-test"
	}
};

if (config) {
	if (config.mqtt_host)
		homieConfig.mqtt.client.host = config.mqtt_host;
	if (config.mqtt_port)
		homieConfig.mqtt.client.port = config.mqtt_port;
}

var myHomieDevice = new HomieDevice(homieConfig);

var buttonNodes = [];

for (var i=0; i < myStreamDeck.NUM_KEYS; i++) {
	var buttonNode = myHomieDevice.node({
		'name': 'button-'+i,
		'friendlyName': 'Streamdeck Button',
		'type': 'button'
	});

	buttonNode.addProperty({
		'name': 'pressed',
		'friendlyName': 'Button '+i+' Pressed',
		'dataType': 'boolean',
		'settable': false
	});

	buttonNodes.push(buttonNode);

	sharp(path.resolve(__dirname, i+'.png'))
		.flatten()
		.resize(myStreamDeck.ICON_SIZE, myStreamDeck.ICON_SIZE)
		.raw()
		.toBuffer()
		.then(buffer => {
			
			console.log("Loading key image for key " + i);
			myStreamDeck.fillImage(i, buffer);
		})
		.catch(err => {
			console.log("Unable to find %d.png - setting key to black", i);
			myStreamDeck.fillColor(i, 0, 0, 0);
		});
}

myStreamDeck.on('down', keyIndex => {
	console.log('Key %d down', keyIndex);
	buttonNodes[keyIndex].getProperty('pressed').publishValue('true');
});
 
myStreamDeck.on('up', keyIndex => {
	console.log('Key %d up', keyIndex);
	buttonNodes[keyIndex].getProperty('pressed').publishValue('false');
});
 
myStreamDeck.on('error', error => {
	console.error(error);
});

myHomieDevice.on('connect', () => {
	console.log("Connected");
	for (var i = 0; i < buttonNodes.length; i++) {
		buttonNodes[i].getProperty('pressed').publishValue('false');
	}
});
 
myHomieDevice.setup();


