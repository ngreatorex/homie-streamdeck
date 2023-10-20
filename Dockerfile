FROM --platform=$BUILDPLATFORM node:18 AS build-deps

WORKDIR /app

COPY ["package.json", "package-lock.json*", "./"]

RUN npm install --omit=dev

FROM node:18

ENV NODE_ENV=production
WORKDIR /app

RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
  --mount=type=cache,target=/var/lib/apt,sharing=locked \
  apt-get update && apt-get --no-install-recommends install -y libusb-1.0-0-dev libudev-dev

COPY --from=build-deps /app .
COPY . .

CMD ["node", "index.js"]
