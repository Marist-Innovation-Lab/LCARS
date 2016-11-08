#!/bin/bash
#
# This script gets the number of todays current attack count
#

# Download the file from the Longtail site that contains the current number of attacks
curl -sO http://longtail.it.marist.edu/honey/dashboard_number_of_attacks.data

numAttacks=`awk 'END{print $1}' dashboard_number_of_attacks.data`
output='{ "attacksCount" : "'$numAttacks'" }'

rm dashboard_number_of_attacks.data

echo $output
