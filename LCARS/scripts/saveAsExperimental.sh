#!/bin/bash
#
# This script saves a honeypot or BlackRidge Log as an experimental log
# Two command line parameters are required: $1 = pathToRawLogToCopy, $2 = filenameToSaveAs
#

cp -f /var/www/html$1 /var/www/html/lcars/runtime/logs/experimental/$2.log
