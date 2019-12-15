const { openStreamDeck } = require('elgato-stream-deck');
const HomieDevice = require('homie-device'); 
const path = require('path');
const sharp = require('sharp');

const package = require('./package.json');
const config = require('./config.json');

var myStreamDeck = openStreamDeck();
var serialNumber = myStreamDeck.getSerialNumber();

var homieConfig = {
	"name": "Homie Streamdeck",
	"device_id": "homie-streamdeck-"+serialNumber,
	"mqtt": {
		"host": "localhost",
		"poer": 1883,
		"base_topic": "homie/"
	}
};

if (config) {
	if (config.mqtt_host)
		homieConfig.mqtt.host = config.mqtt_host;
	if (config.mqtt_port)
		homieConfig.mqtt.port = config.mqtt_port;
}

var myHomieDevice = new HomieDevice(homieConfig);
myHomieDevice.setFirmware(package.name, package.version);

var buttonNodes = [];

for (let i=0; i < myStreamDeck.NUM_KEYS; i++) {
	var buttonNode = myHomieDevice.node('button_'+i, 'Streamdeck Button', 'button');
	buttonNode.advertise('pressed').setName('Button Pressed').setDatatype('boolean');

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
	buttonNodes[keyIndex].setProperty('pressed').send('true');
});
 
myStreamDeck.on('up', keyIndex => {
	console.log('Key %d up', keyIndex);
	buttonNodes[keyIndex].setProperty('pressed').send('false');
});
 
myStreamDeck.on('error', error => {
	console.error(error);
});
 
myHomieDevice.setup();


