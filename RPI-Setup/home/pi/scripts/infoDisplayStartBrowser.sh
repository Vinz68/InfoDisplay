#!/bin/bash
. /home/pi/scripts/infoDisplayConfig

# Initial Delay to let X-Window manager start completely,
# and on next runs: do not check to frequently if browser is running (or not).
sleep 20s

# Startup web-browser "iceweasel" when it is not running; and use a default startup-page.
if [ -z "$(pgrep iceweasel)" ];
   then (sudo -u pi iceweasel --profile ~/.config http://localhost/index.html --display=:0) &
   sleep 15s;			# allow browser to startup
   xte "key F11" -x:0;		# simulate F-11 to go full-screen
fi

# start myself again (in case iceweasel is closed or crashed; start it again)
bash $0 &

