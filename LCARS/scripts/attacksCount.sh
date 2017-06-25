#!/bin/bash
#
# This script gets the number of todays current attack count
#

# Download the file from the Longtail site that contains the current number of attacks
curl -sO http://longtail.it.marist.edu/honey/dashboard_number_of_attacks.data

numAttacks=`awk 'END{print $1}' dashboard_number_of_attacks.data`

# If it's a Sunday, look for where Longtail reset the numbers to get the attacks that came in before that
# and add that number to the total number of attacks
if [[ $(date +%u) == 7 ]]; then
    num=`awk '$1 < prev { print prev } { prev = $1 }' dashboard_number_of_attacks.data`
    numAttacks=$(($numAttacks+$num))
fi

output='{ "attacksCount" : "'$numAttacks'" }'

rm dashboard_number_of_attacks.data

echo $output
