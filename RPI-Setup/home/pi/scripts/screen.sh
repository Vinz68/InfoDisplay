#!/bin/bash

. /home/pi/scripts/config

if [ $1 = 'on' ]; then
	log "Turning screen on...."
	/usr/bin/tvservice -p;
	/bin/fbset -depth 8;
	/bin/fbset -depth 16;
	/bin/chvt 6;
	/bin/chvt 7;
	log 'Switched Screen ON.'
fi

if [ $1 = 'off' ]; then
  /usr/bin/tvservice -o
  log 'Switched Screen OFF.'
fi

