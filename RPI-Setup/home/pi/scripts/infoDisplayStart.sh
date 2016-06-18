
#!/bin/bash

. /home/pi/scripts/infoDisplayConfig

# Check config file if we need auto detect/startup of InfoDisplay
if [ "$detectAndStartInfoDisplay" == "true" ]; then
	log "Check InfoDisplay is running..."

	# Startup InfoDisplay when it is not running.
	if pgrep -xf "node /home/pi/InfoDisplay/infoDisplay.js" > /dev/null
	then
	   	log "InfoDisplay is (still) up-and-running...";
	else
		log "infoDisplay is Starting..."
		cd /home/pi/InfoDisplay; 
		sudo -u pi node /home/pi/InfoDisplay/infoDisplay.js & >/dev/null 2>&1
		log "InfoDisplay is Started.";
	fi
else
	log "DO NOT Check InfoDisplay is running..."
fi


# Delay on next runs: do not check to frequently (or not).
sleep 30s

# start myself again (in case infoDsiplay is closed or crashed; start it again)
bash /home/pi/scripts/infoDisplayStart.sh &

