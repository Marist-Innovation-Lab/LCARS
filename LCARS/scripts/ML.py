'''
Given a model and test matrix to use, this script predicts what class the test
matrix is classified as.

Only supports binary class models.
'''
import numpy
import os
import sys
import json
import ConfigParser
from io import StringIO
from keras.models import model_from_yaml

messages = [] # List of responses to send back to client
config = ConfigParser.ConfigParser()

def main():
  cfg = config.read('ML.ini')
  if len(cfg) == 0:
    messages.append({"log":("No configuration file found. Creating basic configuration file" +
        " ML.ini.")})

    cfgfile = open("ML.ini",'w')

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

    config.read('ML.ini')

  try:
      MODEL_DIR = ConfigSectionMap("ModelOptions")['model_dir']
      TEST_DIR  = ConfigSectionMap("TestOptions")['test_dir']
      SHAPE_X   = ConfigSectionMap(sys.argv[1])['shape_x']
      SHAPE_Y   = ConfigSectionMap(sys.argv[1])['shape_y']
      CLASS_0   = ConfigSectionMap(sys.argv[1])['class_0']
      CLASS_1   = ConfigSectionMap(sys.argv[1])['class_1']
  except (KeyError,ConfigParser.NoSectionError):
      messages.append({"log":("Could not find all configuration options for " + sys.argv[1] +
          ". Using defaults.")})
      MODEL_DIR = ConfigSectionMap("ModelOptions")['model_dir']
      TEST_DIR  = ConfigSectionMap("TestOptions")['test_dir']
      SHAPE_X   = ConfigSectionMap("Defaults")['shape_x']
      SHAPE_Y   = ConfigSectionMap("Defaults")['shape_y']
      CLASS_0   = ConfigSectionMap("Defaults")['class_0']
      CLASS_1   = ConfigSectionMap("Defaults")['class_1']

  # messages.append({"log":("Started command: " +
  #     sys.argv[0], sys.argv[1], sys.argv[2], sys.argv[3])})

  yaml_file = open(MODEL_DIR + sys.argv[1],'r')
  loaded_model_yaml = yaml_file.read()
  yaml_file.close()

  loaded_model = model_from_yaml(loaded_model_yaml)
  messages.append({"log":"Loaded model: " + sys.argv[1]})
  # load weights into new model
  loaded_model.load_weights(MODEL_DIR + sys.argv[2]) 
  messages.append({"log":("Loaded corresponding weights: " + sys.argv[2])})
  # StringIO needs a unicode string
  test_matrix = unicode(open(TEST_DIR + sys.argv[3],'r').read()) 
  matrix = numpy.loadtxt(StringIO(test_matrix),delimiter=',').reshape(int(SHAPE_X),
                                                                      int(SHAPE_Y)
                                                                     )
  prediction = loaded_model.predict(matrix)

  result = numpy.argmax(prediction) # Gets index of most likely outcome

  if result == 0:
      messages.append({"message":(CLASS_0 + " (" + str(prediction[0][result]) +
          "% confidence)")})
  elif result == 1:
      messages.append({"message":(CLASS_1 + " (" + str(prediction[0][result]) + 
          "% confidence) ")})

  print(json.dumps(messages))

'''
Looks up values in an .ini file.

See https://wiki.python.org/moin/ConfigParserExamples
'''
def ConfigSectionMap(section):
    dict1 = {}
    options = config.options(section)
    for option in options:
        try:
            dict1[option] = config.get(section, option)
            if dict1[option] == -1:
                DebugPrint("skip: %s" % option)
        except:
            print("exception on %s!" % option)
            dict1[option] = None
    return dict1

if __name__ == '__main__':
    main()