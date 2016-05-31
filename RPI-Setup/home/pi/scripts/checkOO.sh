#!/bin/bash

. /home/pi/scripts/config


pid=`ps -ef | grep soffice |  grep -v grep | cut -c 9-16 | wc -l`

if [ "x$pid" == "x0" ]; then
	log "Open Office is not running, starting it..."
	#/home/pi/scripts/startOO.sh & >/dev/null 2>&1
	log "..Started."
fi
