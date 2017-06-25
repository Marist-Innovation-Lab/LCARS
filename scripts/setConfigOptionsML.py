import json
import ConfigParser
import sys

messages = []
config = ConfigParser.ConfigParser()
jsonObject = json.loads(sys.argv[1])

def main():
  cfg = config.read('/var/www/html/lcars/scripts/ML.ini')
  if len(cfg) == 0:
    messages.append({"log":("No configuration file found. Creating basic configuration file" +
        " ML.ini.")})

    cfgfile = open('/var/www/html/lcars/scripts/ML.ini','wb')

    config.add_section('Defaults')
    config.set('Defaults','shape_x',1)
    config.set('Defaults','shape_y', 5625)
    config.set('Defaults','class_0', 0)
    config.set('Defaults','class_1', 1)
    config.add_section('ModelOptions')
    config.set('ModelOptions','model_dir','/var/www/html/lcars/models/')
    config.add_section('TestOptions')
    config.set('TestOptions','test_dir','/var/www/html/lcars/tests/')
    config.write(cfgfile)
    cfgfile.close()

    config.read('/var/www/html/lcars/scripts/ML.ini')

  try:
    for obj, val in jsonObject.iteritems():
      config.set(sys.argv[2],obj,val)
  except ConfigParser.NoSectionError:
    messages.append({"log":("Unable to find existing configuation for " + sys.argv[2] + ". Making section.")})
    config.add_section(sys.argv[2])
    for obj, val in jsonObject.iteritems():
      config.set(sys.argv[2],obj,val)
  with open('/var/www/html/lcars/scripts/ML.ini','wb') as configfile:
    config.write(configfile)
    messages.append({"log":("Successfully updated configuration of " + sys.argv[2] + ".")})

  print(json.dumps(messages))

if __name__ == '__main__':
    main()
