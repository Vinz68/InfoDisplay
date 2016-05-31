#!/bin/bash

. /home/pi/scripts/config


# restart libre office
log "Stopping Open Office..."
kill -9 `ps -ef | grep soffice | grep -v grep | cut -c 9-16` >/dev/null 2>&1
log "Stopped Open Office."

