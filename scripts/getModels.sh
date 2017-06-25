#!/bin/bash
# Returns all file names of models (with .yaml extension) in the models directory as JSON 
model_dir="/var/www/html/lcars/runtime/models"
output="["

output+=$(find "$model_dir" -type f -iname '*.yaml' -printf '{"model_name":"%f"},')

echo "${output::-1}]"