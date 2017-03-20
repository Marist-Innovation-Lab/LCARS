// ML.js - javascript functions for ML dash in LCARS 

currentModel = "";
// Populate data on page load
$(document).ready(function() {
	populateModels();
	registerButtons();
});

function populateModels(){
  $.getJSON(_lcarsAPI + "models", function(data, status){
  		if (status === "success") {
  			$("#models").empty();

  			$.each(data, function(i,item) {
  				var name = data[i].model_name;

  				$("#models").append('<tr><th scope="row">' + (i+1) + '</th>'
  					+ '<td>' + name + '</td>'
  					+ '<td>' + 'Put description here' + '</td>'
  					+ '<td>' + '<button type="button" class="btn btn-default btn-xs" data-toggle="modal" data-target="#model-modal"><span title="Make prediction" class="glyphicon glyphicon-question-sign"></span></button></td>'
  					+ '</tr>'
  					);
  			});
  		}
  });
}

// Predicts an outcome, given a model and a matrix to predict for
function predict(model_name, matrix){
	dataObject = {'model_name':model_name, 'model_weights': model_name.replace("yaml","h5"), 'matrix':matrix};
	$.ajax({
            url: _lcarsAPI + "predict",
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(dataObject),
            success: function(data) { console.log(data); }
    });
}

// Adds onclick events to buttons
function registerButtons(){
	registerPredictButton();
	registerTableButtons();
}

function registerTableButtons(){
	$("#models").on("click", "td button", function() {
		currentModel = $(this).closest("tr").find("td:nth-child(2)").text();
	});
}

function registerPredictButton(){
	$('#predict-button').click(function() {
		predict(currentModel, $('#predict-data').val());
	});
}
