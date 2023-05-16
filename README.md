# homie-streamdeck
Present an Elgato Stream Deck as a Homie MQTT device

# Configuration
You can specify the MQTT host and port using a file named `config.json`. This should specify two fields: `mqtt_host` and `mqtt_port`. For example:

```
{
  "mqtt_host": "localhost",
  "mqtt_port": 1883
}
```

The program will try to load a PNG image for each key from the current working directory. The images should be named simply `<key number>.png`, 
with the first key (top left) being key 0.

# Installation
A systemd unit file is [provided](systemd/homie-streamdeck.service) if you wish to install it as a systemd service. 
You will need to edit the `WorkingDirectory=` line in the file and then copy it into `/etc/systemd/system`. Once you've done that, you can run the following:
```
systemctl refresh-daemon
systemctl enable --now homie-streamdeck.service
```

# Docker
Alternatively, a Docker image of this is available on [Docker Hub](https://hub.docker.com/repository/docker/ngreatorex/homie-streamdeck/general). 
