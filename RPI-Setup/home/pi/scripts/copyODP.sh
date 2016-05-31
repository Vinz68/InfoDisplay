#!/bin/bash

. /home/pi/scripts/config

if [ -f $src_folder/$odp_filename ]; then

	if [ -f $dst_folder/$odp_filename ]; then
		log "Backing up the previous file..."
		cp $dst_folder/$odp_filename $dst_folder/$odp_filename.backup
		log ".. done."
	fi
	log "Moving $src_folder/$odp_filename to $dst_folder...."
	mv $src_folder/$odp_filename $dst_folder
	chmod 777 $dst_folder/$odp_filename
	log ".. moved."	

	# restart libre office
	log "Restarting Open Office..."
	/home/pi/scripts/startOO.sh >/dev/null 2>&1
	log "..restarted."
else
	# no file to copy, check if still running....
	pid=`ps -ef | grep soffice |  grep -v grep | cut -c 9-16 | wc -l`
	if [ "x$pid" == "x0" ]; then
		log "Open Office is not running, starting it..."
		/home/pi/scripts/startOO.sh & >/dev/null 2>&1
		log "..Started."
	fi
fi
