#!/bin/bash
#
# This script gets the current active honeypot log from longtail, and stores it in separate files based on honeypot hostname
#

# Download and decompress log file from longtail
curl -sO http://longtail.it.marist.edu/honey/current-raw-data.gz
gunzip -f current-raw-data.gz

# Directory to store log files
log_dir="/var/www/html/lcars/runtime/logs/longtail"

# Clear current contents of log directory so that log data from inactive honeypots doesn't linger
rm -rf $log_dir/*

cp -f current-raw-data $log_dir

# Find all active honeypot hostnames from current-raw-data log and store them in an array 
honeypots=($(awk '!seen[$2] {print $2} {++seen[$2]}' current-raw-data))
# Find all log entries that match active honeypot hostnames, and store them in their own files
for i in "${honeypots[@]}"
do
   awk -v i="$i" '$2 == i {print}' current-raw-data | sort -k 1 > $log_dir/${i,,}.log  #${i,,} changes text to lowercase, so that AWS is saved as aws.log, not AWS.log
done

# Run python script that converts all the new logs to json
python /var/www/html/lcars/scripts/Messages-to-Json.py

# Remove original log file
rm current-raw-data
