#/bin/bash
#
# This script returns the number of attacks by broken up by country
#
#

# Get the file from Longtail that contains the country attacks information we need
curl -sO http://longtail.it.marist.edu/honey/index-map.shtml

# Extract the data we need into its own separate file
grep "^\['" index-map.shtml | awk -F"," '{print $1, $2}' | tr -d "'|[" | sort -k2nr > data.txt

# Convert the data into JSON
countryData=`awk '{print "{\"country\":\"" $1 "\", \"attacks\":" $2 "}, "}' data.txt`

# Add square brackets to the JSON so we get an array of JSON objects
output="[${countryData%, }]"

# Print
echo $output

rm data.txt
rm index-map.shtml
