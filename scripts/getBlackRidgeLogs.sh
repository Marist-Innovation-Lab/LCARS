#!/bin/bash
#
# This script gets the current BlackRidge Logs from rsyslog, and stores them in separate files based on gateway hostname
#

# Directory to store log files
log_dir="/var/www/html/lcars/runtime/logs/blackridge"

# Get current contents of rsyslog and clear it out
cp -f /var/log/rsyslog .
> /var/log/rsyslog

# Grab only the discarded log entries
grep "DISCARD" rsyslog > discards

# Find all gateway hostnames and store them in an array
gateways=($(awk '!seen[$4] {print $4} {++seen[$4]}' discards))
# Find all log entries that match the hostnames, and store them in their own files
for i in "${gateways[@]}"
do
   awk -v i="$i" '$4 == i {print}' discards >> $log_dir/${i,,}.log  #${i,,} changes text to lowercase, so that AWS is saved as aws.log, not AWS.log
done

# Run python script that converts all the new logs to json
python /var/www/html/lcars/scripts/Messages-to-Json.py

rm rsyslog
rm discards
