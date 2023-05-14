#!/bin/sh

# From https://stackoverflow.com/questions/242538/unix-shell-script-find-out-which-directory-the-script-file-resides
a="/$0"; a="${a%/*}"; a="${a:-.}"; a="${a##/}/"; BINDIR=$(cd "$a"; pwd)

DOCKER_BUILDKIT=1 docker build -t ngreatorex/homie-streamdeck $BINDIR/..
