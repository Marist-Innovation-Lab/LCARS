
var lcarsAPI = "http://10.10.7.84:8081/"

// Creates a new attack profile from modal window that opens when "Create Attack Profile" button is clicked
function createProfile() {

   // Clear modal of inputs left from the previous time it was opened.
   clearModal();

   $("#create-profile").on("click", function() {
      var name = $("#profile-name").val();
      var details = $("#profile-details").val();
     
      if (name === "" || details === "") {
         console.log("Error");   // Create a real error message
      } else {
         // Build object that will be converted to JSON data that gets passed through the API
         var dataObject = { 'name': name, 'details': details };
        
         $.ajax({
                 url: lcarsAPI + "profiles/",
                 type: 'PUT',
                 contentType: 'application/json',
                 data: JSON.stringify(dataObject),
                 success: populateProfiles()
         });
         
         // Close the modal window
         $(".modal").modal("hide");
      }
   });

}


// Clears the input boxes in the modal because they do not automatically clear on close 
function clearModal() {
   $(".modal").on("hidden.bs.modal", function() {
      $("#profile-name").val("");
      $("#profile-details").val("");
   });
}


// Determines which Action button or link was clicked in the Response Recipes section and executes the appropriate action
function getRecipesActionButton() {
    $("#response-recipes").on("click", "td button", function() {
        // Gets the text of the button that was clicked to determine which it was
        var button = $(this).text().toLowerCase();
 
        var rrid = $(this).closest("tr").find("th").text();
        var name = $(this).closest("tr").find("td:nth-child(2)"); 
        var actions = $(this).closest("tr").find("td:nth-child(4)");
 
        function editMode() {
           name.html('<input value="' + name.html() + '"></input>');
           actions.html('<button type="button" class="btn btn-primary btn-xs">Submit</button><button type="button" class="btn btn-primary btn-xs">Delete</button>'
            + '<button type="button" class="btn btn-primary btn-xs">Cancel</button>');
        }

        if (button === "view details") {
           getRecipeDetails(rrid);
        } else if (button === "edit") {
           editMode();
        } else if (button === "cancel") {
           populateRecipes();
        } else if (button === "submit") {
           editedName = name.find("input").val();
           editRecipe(rrid, editedName);
        } else if (button === "delete") {
          deleteRecipe(rrid);
        }
    });
}    


// Determines which Action button was clicked in the Profiles section and executes the appropriate action
function getProfilesActionButton() {
    $("#profiles").on("click", "td button", function() {
        // Gets the text of the button that was clicked to determine which it was
        var button = $(this).text().toLowerCase();
        
        var pid = $(this).closest("tr").find("th").text();
        var name = $(this).closest("tr").find("td:nth-child(2)");
        var details = $(this).closest("tr").find("td:nth-child(3)");
        var actions = $(this).closest("tr").find("td:nth-child(5)");

        // Changes the selected table row's fields into input boxes to allow editing
        // Changes action buttons to Submit and Cancel
        function editMode() {
           name.html('<input value="' + name.html() + '"></input>');
           details.html('<input value="' + details.html() + '"></input>');
           actions.html('<button type="button" class="btn btn-primary btn-xs">Submit</button><button type="button" class="btn btn-primary btn-xs">Cancel</button>');
        }

        if (button === "edit") {
           editMode();
        } else if (button === "cancel") {
           populateProfiles();
        } else if (button === "submit") {
           editedName = name.find("input").val();
           editedDetails = details.find("input").val();
           editProfile(pid, editedName, editedDetails);
        } 
    });
}


// Edits Attack Profile based on the user inputs
function editProfile(pid, name, details) { 
    var dataObject = { 'name': name, 'details': details };
    $.ajax({
            url: lcarsAPI + "profiles/" + pid,
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(dataObject),
            success: function() { return populateProfiles(); }
    });
}

// Edits response recipe based on the user inputs, can only edit Name at this time
function editRecipe(rrid, name) {
    var dataObject = { 'name': name };
    $.ajax({
            url: lcarsAPI + "responserecipes/" + rrid,
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(dataObject),
            success: function() { return populateRecipes(); }
    });
}

// Deletes a specified response recipe 
function deleteRecipe(rrid) {
  $.ajax({
          url: lcarsAPI + "responserecipes/" + rrid,
          type: 'DELETE',
          contentType: 'application/json',
          success: function() { return populateRecipes(); }
  });
}


// Gets the response recipe details for the selected response recipe
function getRecipeDetails(rrid) {
    $.getJSON(
      lcarsAPI + "responserecipes/" + rrid,
      function (data, status) {
         if (status === "success") {
           $("#recipe-details").find("tbody").html("");
           $("#recipe-details").find("h4").text("Response Details: " + data[0].responserecipes__name);
           $.each(data, function(i, item) {
              $("#recipe-details").find("tbody").append('<tr><th scope="row">' + data[i].responsedetails__rulenum + '</th>'
                                                      + '<td>' + data[i].responsedetails__target.capitalize() + '</td>'
                                                      + '<td>' + data[i].responsedetails__chain.capitalize() + '</td>'
                                                      + '<td>' + data[i].responsedetails__protocol.formatProtocol() + '</td>'
                                                      + '<td>' + data[i].responsedetails__source + '</td>'
                                                      + '<td>' + data[i].responsedetails__destination + '</td>');
           });
           $("#recipe-details").modal("show"); 
         }
      });
}


// Populates Response Recipes tables in Threat Intel and Reconfigurator pages with data from the database
function populateRecipes() {
    $.getJSON(
      lcarsAPI + "responserecipes",
      function (data, status) {
         if (status === "success") {
            $("#response-recipes").empty();
            $.each(data, function(i, item) {
               $("#response-recipes").append('<tr><th scope="row">' + data[i].responserecipes__rrid + '</th>'
                                           + '<td>' + data[i].responserecipes__name + '</td>'
                                           + '<td>' + data[i].responserecipes__updatedate + '</td>'
                                           + '<td><button type="button" class="btn btn-primary btn-xs">View Details</button>'
                                           + '<button type="button" class="btn btn-primary btn-xs">Edit</button></td></tr>');
               $("#deploy-response-recipes").append('<tr><th scope="row">' + data[i].responserecipes__rrid + '</th>'
                                                  + '<td>' + data[i].responserecipes__name + '</td>'
                                                  + '<td><button type="button" class="btn btn-primary btn-xs">Deploy</button></td></tr>');
            });
         }
      });    

}


// Populates Profiles table in Threat Intel page with data from the database
function populateProfiles() {
    $.getJSON(
      lcarsAPI + "profiles",
      function (data, status) {
         if (status === "success") {
            $("#profiles").empty();
            $.each(data, function(i, item) {
               $("#profiles").append('<tr><th scope="row">' + data[i].profiles__pid + '</th>'
                                   + '<td>' + data[i].profiles__name + '</td>'
                                   + '<td>' + data[i].profiles__details + '</td>'
                                   + '<td>' + data[i].profiles__updatedate + '</td>'
                                   + '<td><button type="button" class="btn btn-primary btn-xs">Edit</button></td></tr>');
            });
         }
      });
}


// Deploys selected response recipe on Reconfigurator Page
function deployResponseRecipe() {
    $("#deploy-response-recipes").on("click", "td button", function() {
        var rrid = $(this).closest("tr").find("th").text();

        $.getJSON(
          lcarsAPI + "responserecipes/" + rrid,
          function (data, status) {
             if (status === "success") {
                getResponseRules(data);
             }
          });

    });
}


// Takes array of JSON objects returned by LCARS API and uses it to build the rules to send to the rfw server
function getResponseRules(rules) {
    for (i = 0; i < rules.length; i++) {
        var tar    = rules[i].responsedetails__target.toLowerCase();
        var chn    = rules[i].responsedetails__chain.toLowerCase();
        var prot   = rules[i].responsedetails__protocol.toLowerCase();
        var source = rules[i].responsedetails__source.toLowerCase();
        var dest   = rules[i].responsedetails__destination.toLowerCase();

        if (chn === "input") {
           buildAddRequest(tar, chn, prot, source, null);
        } else if (chn === "output") {
           buildAddRequest(tar, chn, prot, dest, null);
        } else if (chn === "forward") {
           buildAddRequest(tar, chn, prot, source, dest);
        } else {
           console.log("Something went wrong");
        }
   }
}


$(document).ready(function() {

   populateProfiles();
   populateRecipes();      

   createProfile();
   getProfilesActionButton();
   getRecipesActionButton();

   deployResponseRecipe();

});

