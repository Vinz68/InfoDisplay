#!/bin/bash

. /home/pi/scripts/infoDisplayConfig


if pgrep -xf "node /home/pi/InfoDisplay/infoDisplay.js" > /dev/null
then
    echo "Running"
else
    echo "Stopped"
fi


#check if abc is running
if pgrep -xf "node /home/pi/InfoDisplay/infoDisplay.js" > /dev/null
  then
     # abc is running
	 echo "infoDisplay.js is running... ";
  else
     # abc is not running
	 echo "infoDisplay.js is NOT running...";
fi

if [ "$detectAndStartInfoDisplay" == "true" ]; then
	echo "Check InfoDisplay is running..."

	# Startup InfoDisplay when it is not running.
	if pgrep -xf "node /home/pi/InfoDisplay/infoDisplay.js" > /dev/null
	then
	   	echo "InfoDisplay (node) is running...";
	else
		echo "InfoDisplay (node) is NOT running...";
		cd /home/pi/InfoDisplay; 
		node /home/pi/InfoDisplay/infoDisplay.js & >/dev/null 2>&1
		echo "InfoDisplay (node) is STARTED";
	fi
else
	echo "NOT CHECKED InfoDisplay";
fi


