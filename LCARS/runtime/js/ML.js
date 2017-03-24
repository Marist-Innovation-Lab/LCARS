// ML.js - javascript functions for ML dash in LCARS 

currentModel = "";
// Populate data on page load
$(document).ready(function() {
  populateModels();
  populateTests();
});

// Fills list of models using call to API
function populateModels(){
  $.getJSON(_lcarsAPI + "models", function(data, status){
      if (status === "success") {
        $("#models").empty();

        $.each(data, function(i,item) {
          var name = data[i].model_name;

          $("#models").append('<tr><th scope="row">' + (i+1) + '</th>'
            + '<td>' + name + '</td>'
            + '<td>' + 'Put description here' + '</td>'
            + '<td>' + '<span class="radio-inline"><input name="model_radios" type="radio" value=' + name +'></span></td>'  
            + '</tr>'
            );
        });
      }
  });
}

// Fills list of test inputs using call to API
function populateTests(){
  $.getJSON(_lcarsAPI + "tests", function(data, status){
      if (status === "success") {
        $("#tests").empty();

        $.each(data, function(i,item) {
          var name = data[i].test_name;

          $("#tests").append('<tr><th scope="row">' + (i+1) + '</th>'
            + '<td>' + name + '</td>'
            + '<td>' + 'Put description here' + '</td>'
            + '<td>' + '<span class="radio-inline"><input name="test_radios" type="radio" value=' + name +'></span></td>'
            + '</tr>'
            );
        });
      }
  });
}

// Predicts an outcome, given a model and a test case to predict for
function predict(model_name, matrix){
  dataObject = {'model_name':model_name, 'model_weights': model_name.replace("yaml","h5"), 'matrix':matrix};
  $.ajax({
            url: _lcarsAPI + "predict",
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(dataObject),
            success: function(data) { parseData(data); }
  });
}

// Called when prediction data must be displayed
function parseData(data){
  try {
    var jsonObj = JSON.parse(data);
    var logTA = $('#log-textarea');
    var outputTA = $('#output-textarea');
    jsonObj.forEach(function(d){
      if (!(typeof d.log === "undefined"))
        logTA.val(logTA.val() + d.log + '\n');
      if (!(typeof d.message === "undefined"))
        outputTA.val(outputTA.val() + d.message + '\n');
    });
  } catch (ex) {
    console.error(ex);
  }
  

}
