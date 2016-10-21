
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
                 url: lcarsAPI + "profiles",
                 type: 'PUT',
                 contentType: 'application/json',
                 data: JSON.stringify(dataObject),
                 success: function() { return populateProfiles(); }
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
        var button = $(this).children("span").attr("title").toLowerCase();
 
        var rrid = $(this).closest("tr").find("th").text();
        var name = $(this).closest("tr").find("td:nth-child(2)"); 
        var actions = $(this).closest("tr").find("td:nth-child(4)");
 
        function editMode() {
           name.html('<input value="' + name.html() + '"></input>');
           actions.html('<button type="button" class="btn btn-default btn-xs"><span title="Submit" class="glyphicon glyphicon-ok"></button>'
                      + '<button type="button" class="btn btn-default btn-xs"><span title="Cancel" class="glyphicon glyphicon-remove"></span></button>');
        }

        if (button === "view details") {
           getRecipeDetails(rrid);
           getRecipeDetailsActionButton(rrid);
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
        var button = $(this).children("span").attr("title").toLowerCase();     
        
        var pid = $(this).closest("tr").find("th").text();
        var name = $(this).closest("tr").find("td:nth-child(2)");
        var details = $(this).closest("tr").find("td:nth-child(3)");
        var actions = $(this).closest("tr").find("td:nth-child(5)");

        // Changes the selected table row's fields into input boxes to allow editing
        // Changes action buttons to Submit and Cancel
        function editMode() {
           name.html('<input value="' + name.html() + '"></input>');
           details.html('<input value="' + details.html() + '"></input>');
           actions.html('<button type="button" class="btn btn-default btn-xs"><span title="Submit" class="glyphicon glyphicon-ok"></span></button>'
                      + '<button type="button" class="btn btn-default btn-xs"><span title="Cancel" class="glyphicon glyphicon-remove"></span></button>');
        }

        if (button === "edit") {
           editMode();
        } else if (button === "cancel") {
           populateProfiles();
        } else if (button === "submit") {
           editedName = name.find("input").val();
           editedDetails = details.find("input").val();
           editProfile(pid, editedName, editedDetails);
        } else if (button === "delete") {
           //deleteProfile(pid);
        }
    });
}


function getRecipeDetailsActionButton(rrid) {
    $("#recipe-details").on("click", "td button", function() {
        // Gets the title of the button that was clicked to determine which it was
        var button = $(this).children("span").attr("title").toLowerCase();
        
        var rulenum = $(this).closest("tr").find("th").text();
        var target = $(this).closest("tr").find("td:nth-child(2)");
        var chain = $(this).closest("tr").find("td:nth-child(3)");
        var protocol = $(this).closest("tr").find("td:nth-child(4)");
        var source = $(this).closest("tr").find("td:nth-child(5)");
        var dest = $(this).closest("tr").find("td:nth-child(6)");
        var actions = $(this).closest("tr").find("td:nth-child(7)");

        function editMode() {

            target.html(buildSelect({Accept:'Accept',Drop:'Drop',Reject:'Reject'}, target.html()));
            chain.html(buildSelect({Input:'Input',Output:'Output',Forward:'Forward'}, chain.html()));
            protocol.html(buildSelect({All:'All',TCP:'TCP',UDP:'UDP',ICMP:'ICMP'}, protocol.html()));
            actions.html('<button type="button" class="btn btn-default btn-xs"><span title="Submit" class="glyphicon glyphicon-ok"></span></button>'
                      + '<button type="button" class="btn btn-default btn-xs"><span title="Cancel" class="glyphicon glyphicon-remove"></span></button>');
            checkChainSelection(); 
            
            // Checks the selected chain value and decides which IP area to make editable
            function checkChainSelection() {
                if (chain.find("select").val() === 'Input') {
                   source.html('<input></input>');
                   dest.text('0.0.0.0');
                   chain.find("select").on("change", function () { checkChainSelection(); });
                } else if (chain.find("select").val() === 'Output') {
                   dest.html('<input></input>');
                   source.text('0.0.0.0');
                   chain.find("select").on("change", function() { checkChainSelection(); }); 
                } else if (chain.find("select").val() === 'Forward') {
                   source.html('<input style="display:block; width:100%;"></input>');
                   dest.html('<input style="display:block; width:100%;"></input>');
                   chain.find("select").on("change", function() { checkChainSelection(); }); 
                } 
            }
       
            // Dynamically sets the selected option value based on text that was previously there
            // http://stackoverflow.com/questions/2315879/how-do-i-dynamically-set-the-selected-option-of-a-drop-down-list-using-jquery-j
            function buildSelect(options, def) {
            // assume options = { value1 : 'Name 1', value2 : 'Name 2', ... }
            //        default = 'value1'

                var $select = $('<select></select>');
                var $option;

                for (var val in options) {
                   $option = $('<option value="' + val + '">' + options[val] + '</option>');
                   if (val == def) {
                      $option.attr('selected', 'selected');
                   }
                   $select.append($option);
                }

                return $select;
            } 
        
        }

        // Apply action based on which button was clicked
        if (button === "edit") { 
           editMode();
        } else if (button === "cancel") {
           getRecipeDetails(rrid);
        } else if (button === "submit") {

           editedTarget = target.find("select").val();
           editedChain = chain.find("select").val();
           editedProtocol = protocol.find("select").val();
           
           // Determine if the user inputted Source and/or Destination and get the values
           if (editedChain === 'Input') {
              editedSource = source.find("input").val();
              editedDest = '0.0.0.0';
           } else if (editedChain === 'Output') {
              editedSource = '0.0.0.0';
              editedDest = dest.find("input").val();
           } else if (editedChain === 'Forward') {
              editedSource = source.find("input").val();
              editedDest = dest.find("input").val();
           }
           
           // Check that the IPs entered are valid IP addresses
           var ipRegex = /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/g;
           if (editedSource.match(ipRegex) && editedDest.match(ipRegex)) {
              editResponseDetail(rrid, rulenum, editedTarget, editedChain, editedProtocol, editedSource, editedDest);
           } else { 
              $(this).closest("tr").find("input").css("border", "1.5px solid red"); 
           } 
 
        } else if (button === "delete") {
           //deleteResponseDetail();
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


// Edits a response detail for a particular recipe based on the user inputs
function editResponseDetail(rrid, rulenum, target, chain, protocol, source, dest) {
    var dataObject = { 'rulenum': rulenum, 'target': target, 'chain': chain, 'protocol': protocol, 'source': source, 'destination': dest };
    $.ajax({
            url: lcarsAPI + "responsedetails/" + rrid + "/" + rulenum,
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(dataObject),
            success: function() { return getRecipeDetails(rrid); }
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


// Deletes a specified profile
function deleteProfile(pid) {
    $.ajax({
            url: lcarsAPI + "profiles/" + pid,
            type: 'DELETE',
            success: function() { return populateProfiles(); }
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
                                                      + '<td>' + data[i].responsedetails__destination + '</td>'
                                                      + '<td style="text-align: right; border-width:0px;"><button type="button" class="btn btn-default btn-xs"><span title="Edit" class="glyphicon glyphicon-pencil"></span></button><button type="button" class="btn btn-default btn-xs"><span title="Delete" class="glyphicon glyphicon-trash"></span></button></td></tr>');
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
                                           + '<td><button type="button" class="btn btn-default btn-xs"><span title="View Details" class="glyphicon glyphicon-list"></span></button>'
                                           + '<button type="button" class="btn btn-default btn-xs"><span title="Edit" class="glyphicon glyphicon-pencil"></span></button>'
                                           + '<button type="button" class="btn btn-default btn-xs"><span title="Delete" class="glyphicon glyphicon-trash"></span></button></td></tr>');
               $("#deploy-response-recipes").append('<tr><th scope="row">' + data[i].responserecipes__rrid + '</th>'
                                                  + '<td>' + data[i].responserecipes__name + '</td>'
                                                  + '<td style="text-align: center;"><button type="button" class="btn btn-default btn-xs"><span title="Deploy" class="glyphicon glyphicon-new-window"></span></button></td></tr>');
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
                                   + '<td><button type="button" class="btn btn-default btn-xs"><span title="Edit" class="glyphicon glyphicon-pencil"></span></button>'
                                   + '<button type="button" class="btn btn-default btn-xs"><span title="Delete" class="glyphicon glyphicon-trash"></span></button></td></tr>');
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

