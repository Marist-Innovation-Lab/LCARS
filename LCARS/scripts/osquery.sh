#!/bin/bash
#
# This script allows a set of osquery commands to be executed
# A command line parameter is required to determine which osquery command to run
#

if [[ $1 == "osversion" ]]; then
   osqueryi --json "select * from os_version"   
elif [[ $1 == "interfacedetails" ]]; then
   osqueryi --json "select * from interface_details"
elif [[ $1 == "iptables" ]]; then
   osqueryi --json "select *, (select sum(packets) from iptables) totalpackets from iptables"
else
   echo "OSquery command not specified."
fi
