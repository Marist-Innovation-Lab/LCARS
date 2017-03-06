// ML.js - javascript functions for ML dash in LCARS 

// Populate data on page load
$(document).ready(function() {
	populateModels();
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
  					+ '<td>' + '<button type="button" class="btn btn-default btn-xs"><span title="Load Model" class="glyphicon glyphicon-download-alt"></span></button></td>'
  					+ '</tr>'
  					);
  			});
  		}
  });
}

// function predict(){

// }

