#!/bin/bash
#
# This script returns information about active honeypots including the hostname and the date/time it was most recently attacked
# Returns an array of JSON objects, hopefully making it easier to handle elsewhere in our code
#


# Directory where all the honeypot logs are stored
log_dir="/var/www/html/lcars/runtime/logs/longtail"

# Begin the JSON output array with an opening square bracket
output="["
# Loop through all of the log files, grabbing the hostname and time from the last line of the file (most recent)
for log_file in $log_dir/*.log; do
   time=`awk 'END{print $1}' $log_file`
   # Change time format so its consistent with other time formatting in LCARS
   formatted_time=`date -d "$time" +'%Y-%m-%d %H:%M:%S'`
   hostname=`awk 'END{print $2}' $log_file`
   logCount=`wc -l < $log_file`
   # Append JSON object to the output array
   output+='{"hostname":"'$hostname'", "time":"'$formatted_time'", "logCount":"'$logCount'"}, '
done

# Prints final output, replacing the ", " after the final JSON object with a closing square bracket
echo "${output%, }]"
