#!/bin/bash
source /home/jooseok/.nvm/nvm.sh
cd /home/jooseok/code/my-ai-agent-v1
node dist/nudge.js >> /home/jooseok/code/my-ai-agent-v1/logs/nudge.log 2>&1
