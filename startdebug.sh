#!/bin/sh
DEBUG=engine,engine:* DEBUG_DEPTH=10 DEBUG_SHOW_HIDDEN=enabled NODE_ENV=debug forever start -al iwbforever.log -o iwbout.log -e iwberr.log app.js

