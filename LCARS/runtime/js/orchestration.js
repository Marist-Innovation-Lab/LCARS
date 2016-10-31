var lcarsAPI = "http://10.10.7.84:8081/";

function createOrchestration() {
	$("#orchestration-create-btn").click(function () {
		var dataObject = {};
		dataObject["pid"] = $("#orchestration-profile-select").val();
		dataObject["rrid"] = $("#orchestration-recipe-select").val();
		$.ajax({
                 url: lcarsAPI + "orchestration",
                 type: 'PUT',
                 contentType: 'application/json',
                 data: JSON.stringify(dataObject),
                 success: function() { return populateOrchestration(); }
         });
	});
}

// Create the dropdown menus for adding a new orchestration
function createDropdowns() {
	var profilesHTML = '';
	var recipesHTML  = '';

	// Populate profiles dropdown
	$.getJSON(
		lcarsAPI + "profiles",
		function(data, status) {
			if(status === "success") {
				var profilesObj = {};
				$.each(data, function(i, item) {
					profilesObj[data[i].profiles__pid] = data[i].profiles__name;
				});
				profilesHTML = buildSelect(profilesObj, '').html();
				$("#orchestration-profile-select").html(profilesHTML);
			}
		}
	);

	$.getJSON(
		lcarsAPI + "responserecipes",
		function(data, status) {
			if(status === "success") {
				var recipesObj = {};
				$.each(data, function(i, item) {
					recipesObj[data[i].responserecipes__rrid] = data[i].responserecipes__name;
				});
				recipesHTML = buildSelect(recipesObj, '').html();
				$("#orchestration-recipe-select").html(recipesHTML);
			}
		}
	);

	
}


// Creates the "Response Orchestration" data at the bottom of the Threat Intel page
function populateOrchestration() {
	var profilesObj = {};

    $.getJSON(
      lcarsAPI + "orchestration",
      function (data, status) {
         if (status === "success") {

            $("#orchestration").empty();

            // This loop repurposes the data into profilesObj for easier manipulation
            $.each(data, function(i, item) {
            	profileName = data[i].profiles__name;
            	recipeName = data[i].responserecipes__name; 
            	detailsObj = {
            		target : data[i].responsedetails__target,
            		chain : data[i].responsedetails__chain,
            		protocol : data[i].responsedetails__protocol,
            		source : data[i].responsedetails__source,
            		destination : data[i].responsedetails__destination
            	};

            	// Put empty object if profile doesn't exist yet
            	if(profilesObj[profileName] === undefined) {
            		profilesObj[profileName] = {};
            	}
            	// Put empty array if recipe doesn't exist yet
            	if(profilesObj[profileName][recipeName] === undefined) {
            		profilesObj[profileName][recipeName] = [];
            	}
            	// Fill the recipes with recipe details
            	profilesObj[profileName][recipeName].push(detailsObj);

            });

            for(var profileName in profilesObj) {
            	var numSteps = 0;
            	var recipeList = "";

            	// Count total response details (# of steps) and format the list of recipe names
            	for(var recipeName in profilesObj[profileName]) {
					if(numSteps !== 0)
						recipeList += ", ";
					recipeList += recipeName;
					numSteps += profilesObj[profileName][recipeName].length;
				}

				// Create "Response Orchestration" display HTML
            	$("#orchestration").append('<li>' +
											   '<div class="block">' +
											      '<div class="tags">' +
											        '<a class="tag" title="'+ profileName + '">' +
											          '<span>'+ profileName +'</span>' +
											        '</a>' +
											      '</div>' +
											      '<div class="block_content">' +
											         '<h2 class="title">' +
													recipeList +
											         '</h2>' +
											        '<div class="byline">' +
											          '<span>'+ numSteps +' steps</span>' +
											        '</div>' +
											        '<p class="excerpt">' +
											        '</p>' +
											      '</div>' +
											   '</div>' +
											'</li>');
            }
         }
      });
      createDropdowns();
}



$(document).ready(function() {
	populateOrchestration();
//	createDropdowns();
	createOrchestration();
});
