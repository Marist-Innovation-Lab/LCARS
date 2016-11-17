#!/bin/bash
#
# This script gets the current honeypot log from longtail, and stores it in separate files based on honeypot hostname
#

# Download and decompress log file from longtail
curl -sO http://longtail.it.marist.edu/honey/current-raw-data.gz
gunzip -f current-raw-data.gz

# Directory to store log files
log_dir="/var/www/html/lcars/runtime/logs/longtail"

cp -f current-raw-data $log_dir
# Find all log entries that match currently known honeypot hostnames, and store them in their own files
awk '$2 == "AWS" {print}' current-raw-data > $log_dir/aws.log
awk '$2 == "shepherd" {print}' current-raw-data > $log_dir/shepherd.log
awk '$2 == "syrtest" {print}' current-raw-data > $log_dir/syrtest.log
awk '$2 == "edu_c" {print}' current-raw-data > $log_dir/edu_c.log
awk '$2 == "erhp" {print}' current-raw-data > $log_dir/erhp.log
awk '$2 == "erhp2" {print}' current-raw-data > $log_dir/erhp2.log
awk '$2 == "ecdal2" {print}' current-raw-data > $log_dir/ecdal2.log
awk '$2 == "cssdn" {print}' current-raw-data > $log_dir/cssdn.log

# Run python script that converts all the new logs to json
python /var/www/html/lcars/scripts/BR-to-Json.py

# Remove original log file
rm current-raw-data
