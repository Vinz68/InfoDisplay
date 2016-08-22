
#!/bin/bash

. /home/pi/scripts/infoDisplayConfig

log "Stopping InfoDisplay..."

/usr/bin/forever stop $tag

## restart libre office
#kill -9 `ps -ef | grep infoDisplayStart | grep -v grep | cut -c 9-16` >/dev/null 2>&1
#kill -9 `ps -ef | grep infoDisplay.js | grep -v grep | cut -c 9-16` >/dev/null 2>&1
log "Stopped InfoDisplay"





