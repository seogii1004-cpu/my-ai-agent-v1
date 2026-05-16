#!/bin/bash
source /home/jooseok/.nvm/nvm.sh
cd /home/jooseok/code/my-ai-agent-v1
npm run bot >> /home/jooseok/code/my-ai-agent-v1/logs/bot.log 2>&1
