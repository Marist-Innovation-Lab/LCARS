#!/bin/bash
#
# This script counts the number of todays current log entries
#

log_dir="/var/www/html/lcars/runtime/logs"

numLogs=`wc -l < $log_dir/current-raw-data`
output='{ "logCount" : "'$numLogs'" }'
echo $output
