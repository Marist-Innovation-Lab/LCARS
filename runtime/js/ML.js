// ML.js - javascript functions for ML dash in LCARS 

currentModel = "";

// Populate data on page load
$(document).ready(function() {
  populateModels();
  populateTests();
  registerPredictButton();
  registerClearButtons();
  registerSaveButton();
  populateModal();
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
            + '<td>' + '<button type="button" class="btn btn-default btn-xs analyze-btn" data-toggle="modal" data-target="#settings-modal">'
            + '<span title="Settings" class="fa fa-gear"></span></button></td>'
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

// Adds onclick functionality to the predict button.
function registerPredictButton(){
  $('#predict-button').click(function() {
    modelName = $('input[name=model_radios]:checked').val();
    testName = $('input[name=test_radios]:checked').val();

    if (typeof modelName === 'undefined' || typeof testName === 'undefined'){
      var logTA = $('#log-textarea');
      logTA.val(logTA.val() + "You must select a model and a test to make a prediction." + '\n');
    } else {
      predict(modelName, testName);
    }
  });
}

// Adds onclick functionality to clear buttons.
function registerClearButtons(){
  var logTA = $('#log-textarea');
  var outputTA = $('#output-textarea');

  $('#clear-log').click(function() {
    logTA.val("");
  });

  $('#clear-output').click(function() {
    outputTA.val("");
  });
}

// Adds save functionality to model settings
function registerSaveButton(){
  $('#modal-save-button').on("click",function(){
    var labels = [];
    var values = [];
    $('#settings-data td').each(function(){
      if ($(this).children().length > 0){
        values.push($(this).children().val());
      } else {
        labels.push($(this).text());
      }
    });
    
    var dataObject = {};

    labels.forEach(function(e,i){
      dataObject[e] = values[i]; 
    });

    dataObject["model"] = $('.modal-title').text().split(/: /)[1];

    $.ajax({
      url: _lcarsAPI + "save",
      type: 'POST',
      contentType: 'application/json',
      data: JSON.stringify(dataObject),
      success: function(data){
        parseData(data);
      }
    });
  });
}

// Populates modal dialog with corresponding model settings information.
function populateModal(){
  $("#models").on("click","td button", function(){
    var modelName = $(this).closest("tr").find("td:nth-child(2)").text();
    $("#settings-modal").find("h4").text("Settings for model: " + modelName);
    var dataObject = {'model_name':modelName};
    $.ajax({
      url: _lcarsAPI + "config",
      type: 'POST',
      contentType: 'application/json',
      data: JSON.stringify(dataObject),
      success: function(data) {
        var result = JSON.parse(data);
        var table = $('<table />').addClass("table");
        var tr = $('<tr />');
        var th1 = $('<th />').text('Setting');
        var th2 = $('<th />').text('Value');
        th1.appendTo(tr);
        th2.appendTo(tr);
        var thead = $('<thead />');
        var tbody = $('<tbody />');
        var bodyData;

        tr.appendTo(thead);
        thead.appendTo(table);

        result.forEach(function(d){
          $('<tr />').append($('<td />').text(Object.keys(d)[0])).append($('<td />').append($('<input type="text" value="'+ d[Object.keys(d)[0]] +'">'))).appendTo(tbody);
        });

        tbody.appendTo(table);
        $('#settings-data').empty();
        $('#settings-data').append(table);
      }
    });
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

// Called when data must be displayed in log or output textareas
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
