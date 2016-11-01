#!/bin/bash

curl -sO http://longtail.it.marist.edu/honey/current-raw-data.gz
gunzip -f current-raw-data.gz

log_dir="/var/www/html/lcars/runtime/logs"

cp -f current-raw-data $log_dir/all.log
awk '$2 == "AWS" {print}' current-raw-data > $log_dir/aws.log
awk '$2 == "shepherd" {print}' current-raw-data > $log_dir/shepherd.log
awk '$2 == "syrtest" {print}' current-raw-data > $log_dir/syrtest.log
awk '$2 == "edu_c" {print}' current-raw-data > $log_dir/edu_c.log
awk '$2 == "erhp" {print}' current-raw-data > $log_dir/erhp.log
awk '$2 == "erhp2" {print}' current-raw-data > $log_dir/erhp2.log
awk '$2 == "ecdal2" {print}' current-raw-data > $log_dir/ecdal2.log
awk '$2 == "cssdn" {print}' current-raw-data > $log_dir/cssdn.log

rm current-raw-data
