### Suprema Biostar Atendance Live Event Capture

This script connects to Suprima Biostar administration software websocket and extract auth success events.

# How to inistall

1) Install requirements using `nmp install`

2) Enable HTTPS from Biostar Setting>Server> Web Server Protecol.

3) Restart the host machine. All Biostar services should restart to applying HTTPS on API webserver.

5) run script using `node run-v2.js`

# Installing in windows as service

Run `nssm-install-service.bat` to install it as windows service. [Before doing it make sure it runs correctly from `run.bat`]

# Runing by PM2

Just go to containing directory using bash and  run `pm2 start`.[It's not recommended on windows]

