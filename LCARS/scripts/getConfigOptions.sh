#!/bin/bash
modelName=$1
result=$(cat /var/www/html/lcars/scripts/ML.ini | awk '/^\s*$/ {next;} /\['$modelName'\]/{f=1;next} /\[/{f=0} f' | awk '{printf "{\"" $1 "\":\"" $3 "\"},"}')
echo "[${result::-1}]"
