#!/bin/sh

docker run -d --name=homie-streamdeck --device=/dev/hidraw0 ngreatorex/homie-streamdeck:latest
