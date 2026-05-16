#!/bin/bash
source /home/jooseok/.nvm/nvm.sh
cd /home/jooseok/code/my-ai-agent-v1
npm start >> /home/jooseok/code/my-ai-agent-v1/logs/cron.log 2>&1
