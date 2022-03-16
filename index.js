import { openStreamDeck } from '@elgato-stream-deck/node';
import { HomieDevice } from '@chrispyduck/homie-device';
import path from 'path';
import sharp from 'sharp';
import { default as winston, format, transports } from 'winston';

import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const packageInfo = require('./package.json');
const config = require('./config.json');

winston.configure({
	level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
	transports: [
		new transports.Console({
			format: format.combine(
				format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
				format.colorize(),
				format.padLevels(),
				format.splat(),
				format.printf(info => `[${info.timestamp}] [${info.name.slice(-20).padStart(20)}] ${info.level} ${info.message}`)
			)
		})
	]
});

const logger = winston.child({
	name: packageInfo.name
});

let myStreamDeck = await openStreamDeck();
let serialNumber = await myStreamDeck.getSerialNumber();

logger.info('Found Stream Deck with %d keys (serial number: %s)', myStreamDeck.NUM_KEYS, serialNumber);

let homieConfig = {
	'friendlyName': 'Homie Stream Deck',
	'name': 'streamdeck-'+serialNumber,
	'firmwareName': packageInfo.name,
	'firmwareVersion': packageInfo.version,
	'mqtt': {
		'client': {
			'host': 'localhost',
			'port': 1883
		},
		'base_topic': 'homie'
	}
};

if (config) {
	if (config.mqtt_host)
		homieConfig.mqtt.client.host = config.mqtt_host;
	if (config.mqtt_port)
		homieConfig.mqtt.client.port = config.mqtt_port;
}

let myHomieDevice = new HomieDevice(homieConfig);

let buttonNodes = [];

for (let i=0; i < myStreamDeck.NUM_KEYS; i++) {
	logger.debug('Creating Homie node for button %d', i);
	let buttonNode = myHomieDevice.node({
		'name': 'button-'+i,
		'friendlyName': 'Stream Deck Button',
		'type': 'button'
	});

	buttonNode.addProperty({
		'name': 'pressed',
		'friendlyName': 'Button '+i+' Pressed',
		'dataType': 'boolean',
		'settable': false
	});

	buttonNodes.push(buttonNode);

	try {
		logger.info('Loading key image for key %d', i);
		const img = await sharp(i+'.png')
			.flatten()
			.resize(myStreamDeck.ICON_SIZE, myStreamDeck.ICON_SIZE)
			.raw()
			.toBuffer();

		logger.info('Loaded key image for key %d; writing to Stream Deck', i);
		myStreamDeck.fillKeyBuffer(i, img);
	} catch (err) {
		logger.warn('Unable to find %d.png; setting key to black', i);
		myStreamDeck.fillKeyColor(i, 0, 0, 0);
	}
}

myStreamDeck.on('down', keyIndex => {
	logger.info('Key %d is down', keyIndex);
	buttonNodes[keyIndex].getProperty('pressed').publishValue('true');
});
 
myStreamDeck.on('up', keyIndex => {
	logger.info('Key %d is up', keyIndex);
	buttonNodes[keyIndex].getProperty('pressed').publishValue('false');
});
 
myStreamDeck.on('error', error => {
	logger.error(error);
});

myHomieDevice.on('connect', () => {
	logger.info('Connected to MQTT');
	for (let i = 0; i < buttonNodes.length; i++) {
		buttonNodes[i].getProperty('pressed').publishValue('false');
	}
});

myHomieDevice.setup();


