import numpy
import os
import sys
import json
from io import StringIO
from keras.models import model_from_yaml

print("arg1:",sys.argv[1])
print("arg2:",sys.argv[2])
print("arg3:",sys.argv[3])

messages = []

yaml_file = open("../models/" + sys.argv[1],'r')
loaded_model_yaml = yaml_file.read()
yaml_file.close()
loaded_model = model_from_yaml(loaded_model_yaml)
messages.append({"message":"Loaded model."})
# load weights into new model
loaded_model.load_weights("../models/" + sys.argv[2])
messages.append({"message":("Loaded corresponding weights: " + sys.argv[2])})

matrix = numpy.loadtxt(StringIO(sys.argv[3])).reshape(1,5625)
prediction = loaded_model.predict(matrix)
result = numpy.argmax(prediction)
    
if result == 0:
    messages.append({"message":("Result: random " + "( " + str(prediction[0][result]) + " )")})
elif result == 1:
    messages.append({"message":("Result: fully connected " + "( " + str(prediction[0][result]) + " )")})

print(json.dumps(messages))



