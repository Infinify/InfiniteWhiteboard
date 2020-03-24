#!/bin/sh
NODE_ENV=production SS_ENV=production forever start -al iwbforever.log app.js

