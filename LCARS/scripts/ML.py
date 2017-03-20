import numpy
import os
import sys
import json
from io import StringIO
from keras.models import model_from_yaml

messages = []

messages.append({"log":("Ran " + sys.argv[0])})

yaml_file = open("/var/www/html/lcars/models/" + sys.argv[1],'r')
loaded_model_yaml = yaml_file.read()
yaml_file.close()
loaded_model = model_from_yaml(loaded_model_yaml)
messages.append({"log":"Loaded model: " + sys.argv[1]})
# load weights into new model
loaded_model.load_weights("/var/www/html/lcars/models/" + sys.argv[2])
messages.append({"log":("Loaded corresponding weights: " + sys.argv[2])})

test_matrix = unicode(open("/var/www/html/lcars/tests/" + sys.argv[3],'r').read())

matrix = numpy.loadtxt(StringIO(test_matrix),delimiter=',').reshape(1,5625)
prediction = loaded_model.predict(matrix)
result = numpy.argmax(prediction)
    
if result == 0:
    messages.append({"message":("random " + "(" + str(prediction[0][result]) + "% confidence)")})
elif result == 1:
    messages.append({"message":("fully connected " + "(" + str(prediction[0][result]) + "% confidence) ")})

print(json.dumps(messages))
