#!/bin/bash
. /home/pi/scripts/infoDisplayConfig

# Initial Delay to let X-Window manager start completely,
# and on next runs: do not check to frequently if browser is running (or not).
sleep 25s

# Startup web-browser "iceweasel" when it is not running; and use a default startup-page.
if [ -z "$(pgrep iceweasel)" ];
   then
   cp /home/pi/.config/xulstore.json_fullscreen /home/pi/.config/xulstore.json  #alway run in fullscreen mode
   sleep 5s;     # allow copy to finish
   (sudo -u pi iceweasel --profile ~/.config http://localhost/index.html --display=:0) &
   sleep 15s;	 # allow browser to startup

fi

# start myself again (in case iceweasel is closed or crashed; start it again)
bash $0 &

