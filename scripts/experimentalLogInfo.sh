#!/bin/bash
#
# This script returns information about experimental logs
# Returns an array of JSON objects, hopefully making it easier to handle elsewhere in our code
#


# Directory where all the experimental logs are stored
log_dir="/var/www/html/lcars/runtime/logs/experimental"

# Begin the JSON output array with an opening square bracket
output="["
# Loop through all of the log files
for log_file in $log_dir/*.log; do
   name=`echo ${log_file##*/} | awk -F'[.]' '{print $1}'`
   logType=`echo ${log_file##*/} | awk -F'[.]' '{print $2}'`
   logCount=`wc -l < $log_file`
   # Append JSON object to the output array
   output+='{"name":"'$name'", "type":"'$logType'", "logCount":"'$logCount'"}, '
done

# Prints final output, replacing the ", " after the final JSON object with a closing square bracket
echo "${output%, }]"
