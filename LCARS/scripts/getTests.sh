#!/bin/bash
# Returns the names of any files in the test directory as JSON 
model_dir="/var/www/html/lcars/runtime/tests"
output="["

output+=$(find "$model_dir" -type f -printf '{"test_name":"%f"},')

echo "${output::-1}]"