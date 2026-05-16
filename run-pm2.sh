#!/bin/bash
source /home/jooseok/.nvm/nvm.sh
cd /home/jooseok/code/my-ai-agent-v1
pm2 resurrect >> /home/jooseok/code/my-ai-agent-v1/logs/pm2-startup.log 2>&1
