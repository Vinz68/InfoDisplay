#!/bin/bash

. /home/pi/scripts/config

# set display:
export DISPLAY=:0.0

# allow connection to X:
log "Allowing 'xhost +'..." 
xhost +

# restart libre office
log "Stopping Open Office..."
kill -9 `ps -ef | grep soffice | grep -v grep | cut -c 9-16` >/dev/null 2>&1

# remove lock file (if any):
if [ -f $dst_folder/$odp_lockfile ]; then
	log  "Removing lock file ($dst_folder/$odp_lockfile..."
	rm -f $dst_folder/$odp_lockfile >/dev/null 2>&1
fi
log "Starting Open Office..."
#sudo -u pi /usr/bin/soffice --show $dst_folder/$odp_filename --norestore --display :0 & >/dev/null 2>&1
log "Started Open Office."
