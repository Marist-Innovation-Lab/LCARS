var lcarsAPI = "http://10.10.7.84:8081/";

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
											           // 'Response Recipe summary Response Recipe summary Response Recipe summary Response Recipe summary' + 
											        '</p>' +
											      '</div>' +
											   '</div>' +
											'</li>');
            }
         }
      });
}

$(document).ready(function() {
	populateOrchestration();
});
