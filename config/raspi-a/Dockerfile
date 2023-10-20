ARG FROM_IMAGE=ngreatorex/homie-streamdeck:master
FROM $FROM_IMAGE

WORKDIR /app

COPY config.json ./
COPY images ./

RUN ln -s images/Main_Off.png 0.png
RUN ln -s images/Uplight_Off.png 1.png
RUN ln -s images/Porch_Off.png 2.png
RUN ln -s images/Main_On.png 3.png
RUN ln -s images/Uplight_On.png 4.png
RUN ln -s images/Porch_On.png 5.png
