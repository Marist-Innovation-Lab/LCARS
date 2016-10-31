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
	var orchestrationArr = [];

    $.getJSON(
      lcarsAPI + "orchestration",
      function (data, status) {
         if (status === "success") {

            $("#orchestration").empty();

            // This loop repurposes the data into profilesObj for easier manipulation
            $.each(data, function(i, item) {
            	pid = data[i].profiles__pid;
            	profileName = data[i].profiles__name;
            	recipeName = data[i].responserecipes__name; 
            	detailsObj = {
            		target : data[i].responsedetails__target,
            		chain : data[i].responsedetails__chain,
            		protocol : data[i].responsedetails__protocol,
            		source : data[i].responsedetails__source,
            		destination : data[i].responsedetails__destination
            	};

            	// Put new object if profile doesn't exist yet
            	if(orchestrationArr[pid] === undefined) {
            		orchestrationArr[pid] = {name: profileName, recipes: {}};
            	}

            	// Put empty array if recipe doesn't exist yet
            	if(orchestrationArr[pid]["recipes"][recipeName] === undefined) {
            		orchestrationArr[pid]["recipes"][recipeName] = [];
            	}
            	// Fill the recipes with recipe details
            	orchestrationArr[pid]["recipes"][recipeName].push(detailsObj);

            });
            console.log(orchestrationArr);
            $.each(orchestrationArr, function(i, item) {
            	// Iterate through all profiles, skipping undefined ones
            	if(item !== undefined) {
	            	var numSteps = 0;
	            	var recipeList = "";

	            	// Count total response details (# of steps) and format the list of recipe names
	            	for(var recipeName in item["recipes"]) {
						if(numSteps !== 0)
							recipeList += ", ";
						recipeList += recipeName;
						numSteps += item["recipes"][recipeName].length;
					}

					// Create "Response Orchestration" display HTML
	            	$("#orchestration").append('<li>' +
												   '<div class="block">' +
												      '<div class="tags">' +
												        '<a class="tag" title="'+ item["name"] + '">' +
												          '<span>'+ item["name"] +'</span>' +
												        '</a>' +
												      '</div>' +
												      '<div class="block_content">' +
												         '<h2 class="title">' +
														recipeList + ' <button type="button" pid="' + i + '" class="btn btn-default btn-xs"><span title="Edit" class="glyphicon glyphicon-pencil"></span></button>' +
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
            });
         }
      });
      createDropdowns();
}

function onEditOrchestrationClick() {
	$("#orchestration").on("click", "li div div h2 button", function () {
		var pid = $(this).attr("pid");
	});
}

$(document).ready(function() {
	populateOrchestration();
//	createDropdowns();
	createOrchestration();
	onEditOrchestrationClick();
});
