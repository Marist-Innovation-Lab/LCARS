#import geo_cheese
import re
import json
import os
import time
import datetime

# Debug Variable
debug = False

# Move FIle Variable - Whether you want to move parsed files or not
move_file = False

# File to Read Path
#read_path = "read_folder/"
read_paths = ["/var/www/html/lcars/runtime/logs/longtail/", "/var/www/html/lcars/runtime/logs/blackridge/"]

# File to Store Path
#json_store_path = "valid_json/"
parsed_file_path = "finished_parsing/"

# Local Database
#database = "local_dbs/GeoLite2-City.mmdb"

# Time for functions - Gives how long it takes to fun in seconds.
if debug:
    start_time = time.time()

# Function to parse the file and gather information
def create_json(regex_code, read_name):
    #filter_ips = []
    if not os.path.exists(json_store_path):
        if debug:
            print("No folder detected...creating 'valid_json' folder...")
        os.makedirs(json_store_path)
    date_time = datetime.datetime.today().strftime('%Y-%m-%d-%H%M%S')

    if regex_code == "BlackRidge":
        # File To Read
        file_to_read = read_name
        # File To Print
        file_to_print = json_store_path + file_to_read + ".json"
        syslog = open(read_path + file_to_read).read()
        syslog = re.findall('(Gateway1.*gwAction="DISCARD)', syslog)
        #syslog = re.findall('(Gateway1.*gwAction="FORWARD)', syslog)

        # IP Addresses to filter
        '''while True:
            ip = raw_input("Please enter the IP Address you want to filter or leave blank to quit: ")
            if not ip:
                break
            elif ip:
                filter_ips.append(ip)
        print filter_ips
        # Filters the list of the selected IP Addresses
        for ips in filter_ips:
            for record in xrange(len(syslog)):
                if ips in syslog[record]:
                    syslog[record] = "<NULL VARIABLE>"
        syslog = filter(lambda a: a != "<NULL VARIABLE>", syslog)'''

        syslog = str(syslog)

        syslog_ip = re.findall('src="(\d+.\d+.\d+.\d+)"', syslog)
        syslog_port = re.findall('srcPort="(\d+)"', syslog)
        dest = re.findall('dest="(\d+.\d+.\d+.\d+)"', syslog)
        dest_port = re.findall('destPort="(\d+)"', syslog)

        if debug:
            print("syslog_ip contains: " + str(len(syslog_ip)))
            print("syslog_port contains: " + str(len(syslog_port)))
            print("dest contains: " + str(len(dest)))
            print("dest_port contains: " + str(len(dest_port)) + "\n")

        with open(file_to_print, 'w') as file:
            list_num = 0

            for ip in syslog_ip:

                #results = geo_cheese.find_loc(database,ip)

                #atck_profile = '{"src": "' + syslog_ip[list_num] +'", "src_port": "' + syslog_port[list_num] + '", "dest": "' + dest[list_num] + '", "dest_port": "' + dest_port[list_num] + '", "city": "' + results["city"] + '", "host": "' + results["host"] + '", "subdivision": "' + results["subdivision"] + '", "name": "' + results["name"] + '", "ip": "' + results["ip"] + '", "lat": "' + results["lat"] + '", "country": "' + results["country"] + '", "postal": "' + results["postal"] + '", "ASN": "' + results["ASN"] + '", "long": "' + results["long"] + '"}'
                atck_profile = '{"src": "' + syslog_ip[list_num] +'", "src_port": "' + syslog_port[list_num] + '", "dest": "' + dest[list_num] + '", "dest_port": "' + dest_port[list_num] + '"}'

                file.writelines(str(atck_profile) + "\n")

                #if debug:
                    #print("Printing " + str(list_num+1) + " lines")

                list_num += 1

        return file_to_read

    elif regex_code == "Longtail":
        # File To Read
        file_to_read = read_name
        # File To Print
        file_to_print = json_store_path + file_to_read + ".json"
        # Input each individual line of the file into a list to be run again ReGex
        syslog = open(read_path + file_to_read).readlines()

        # Gets individual values
        syslog_info = []
        # Each isolated line is run against the ReGex, without interference from other lines before and after
        for i in syslog:
            syslog_info.append(re.findall('IP:\s(\d+.\d+.\d+.\d+)\s.*Log:\sUsername:\s(.*)\sPassword:\s(.*)', i))

        # Old ReGex - Saving in case we must revert to older method.
        '''syslog_abnormal = re.findall('IP:\s(\d+.\d+.\d+.\d+)\sPass.*:\sUsername:\s(.*)\sPassword:\s(\s+)', syslog)
        for info in syslog_abnormal:
            if info[2] == " "+"\n":
                new_info = list(info)
                new_info[2] = " "
                syslog_info.append(new_info)
            else:
                syslog_info.append(info)'''

        if debug:
            print(len(syslog))
            print(len(syslog_info))
            print(list(syslog_info[0][0]))
            print(list(syslog_info[1][0]))

        with open(file_to_print, "w") as file:

            for i in range(len(syslog_info)):
                records = list(syslog_info[i][0])
                password = records[2].replace('"', 'DOUBLEQUOTE').replace('-', 'DASH').replace(',', 'COMMA')
                atck_profile = '{"src": "' + records[0] + '", "username": "' + records[1] + '", "password": "' + password + '"}'

                file.writelines(str(atck_profile) + "\n")
                #if debug:
                    #print("Printing " + str(i+1) + " lines")
    else:
        if debug:
            print("File is not recognized...skipping file...")
        return read_name

        # Old Write Function - Saving in case we must revert to older method.
        '''with open(file_to_print, "w") as file:
            list_num = 0

            for ip in syslog_info:
                atck_profile = '{"src": "' + syslog_info[list_num][0] +'", "username": "' + syslog_info[list_num][1] + '", "password": "' + syslog_info[list_num][2] + '"}'

                file.writelines(str(atck_profile) + "\n")
                list_num += 1'''

        return file_to_read


# Counts for number of records, but does not parse file
def count_file():
    filter_ips = []
    syslog = open(file_to_read).read()
    syslog_ip = re.findall('(Gateway1.*gwAction="DISCARD)', syslog)

    # IP Addresses to filter
    while True:
        ip = raw_input("Please enter the IP Address you want to filter or leave blank to quit: ")

        if not ip:
            break
        elif ip:
            filter_ips.append(ip)

    print filter_ips

    # Filters the list of the selected IP Addresses
    for ips in filter_ips:
        for record in xrange(len(syslog_ip)):
            if ips in syslog_ip[record]:
                syslog_ip[record] = "<NULL VARIABLE>"
    syslog_ip = filter(lambda a: a != "<NULL VARIABLE>", syslog_ip)

    # print str(syslog_ip)
    print "Number of attacks to system: " + str(len(syslog_ip))

# This section prints out the time it took the function to run.
if debug:
    run_time = time.time() - start_time
    minutes, seconds = divmod(run_time, 60)
    hours, minutes = divmod(minutes, 60)
    print "Seconds Time Format --- %s seconds ---" % (time.time() - start_time)
    print "Normal Time Format --- %d:%02d:%02d ---" % (hours, minutes, seconds)


#______________ Main Section______________#

# This Section figures out which Regex To Use
for read_path in read_paths:
    if os.listdir(read_path) != []:
        # Grabs all the files in the folder
        file_list = os.listdir(read_path)

        # File to store parsed JSON
        json_store_path = read_path + "parsed_json/" 

        if debug:
            print(str(file_list))

        for i in range(len(file_list)):
            read_file = os.path.join(read_path, file_list[i])
            # Verifies that file being read is in fact a file, not a directory
            if os.path.isfile(read_file):
                with open(read_path + file_list[i], 'r') as f:
                    first_line = f.readline()

                # Grabs file name
                read_name = str(file_list[i])

            if debug:
                print(first_line)

            if re.findall('(\d+-\d+-\d+T\d+:\d+:\d+-\d+:\d+\s\w+\s\w+-\d+\[\d+\]:\sIP:\s\d+.\d+.\d+.\d+\sPassLog:\sUsername:\s.*\sPassword:\s.*)', first_line) != []:
                if debug:
                    print("Longtail messages file...")

                #read_name = str(first_file[i])
                regex_code = "Longtail"

            #elif re.findall('(\w+\s\d+\s\d+:\d+:\d+\sGateway1\skernel:\s\[BlackRidge\|Gateway\|\d+.\d+.\d+.\d+\]\sclass="\w+"\scategory=".*"\sctx="bump0"\ssrc="\d+.\d+.\d+.\d+"\ssrcPort="\d+"\sdest="\d+.\d+.\d+.\d+"\sdestPort="\d+"\sidentity="\w+"\sgwAction="\w+"\sgwMode="\w+")', first_line) != []:
            elif re.findall('(\w+\s\d+\s\d+:\d+:\d+\sGateway1.*")', first_line) != []:              
                if debug:
                    print("BlackRidge syslog file...")
                #read_name = str(first_file[i])
                regex_code = "BlackRidge"

            else:
                if debug:
                    print("File not in correct format to be parsed...")
                regex_code = ""

            file_name = create_json(regex_code, read_name)

            if move_file:
                if not os.path.exists(parsed_file_path):
                    if debug:
                        print("No folder detected...creating 'finished_parsing' folder...")
                    os.makedirs(parsed_file_path)
                os.rename("read_folder/" + file_name, "finished_parsing/" + file_name)
    else:
        if debug:
            print("No files to read...")

# Test Running Function
#file_name = create_json("Longtail", "current-raw-data")
#os.rename("read_folder/"+ file_name, "finished_parsing/"+ file_name)
