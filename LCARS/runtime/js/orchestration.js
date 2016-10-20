var lcarsAPI = "http://10.10.7.84:8081/";

function populateOrchestration() {
    $.getJSON(
      lcarsAPI + "orchestration",
      function (data, status) {
         if (status === "success") {
            $("#orchestration").empty();
            $.each(data, function(i, item) {
            	if(data[i].responserecipes[0].responserecipes__name !== "") {
	            	var recipeList = "";
	               $.each(data[i].responserecipes, function(j, item2) {
	               		recipeList += data[i].responserecipes[j].responserecipes__name;
	               });

	               $("#orchestration").append('<li>' +
											   '<div class="block">' +
											      '<div class="tags">' +
											        '<a class="tag" title="'+ data[i].profiles__name + '">' +
											          '<span>'+ data[i].profiles__name +'</span>' +
											        '</a>' +
											      '</div>' +
											      '<div class="block_content">' +
											         '<h2 class="title">' +
											            recipeList +
											         '</h2>' +
											        '<div class="byline">' +
											          '<span> steps</span>' +
											        '</div>' +
											        '<p class="excerpt">' +
											           'Response Recipe summary Response Recipe summary Response Recipe summary Response Recipe summary' + 
											        '</p>' +
											      '</div>' +
											   '</div>' +
											'</li>');
           		}
            });
         }
      });
}




$(document).ready(function() {
	populateOrchestration();
});
