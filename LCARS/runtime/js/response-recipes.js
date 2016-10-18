
var lcarsAPI = "http://10.10.7.84:8081/"

function getButtonClicked() {
   clearModal();
   $("#create-profile").on("click", function() {
      var name = $("#profile-name").val();
      var det = $("#profile-details").val();
      console.log(name,det);
      if (name === "" || det === "") {
         console.log("open");
      } else {
         createProfile(name, det);
         $(".modal").modal("hide");
      }
   });
}

function clearModal() {
   $(".modal").on("hidden.bs.modal", function() {
      $("#profile-name").val("");
      $("#profile-details").val("");
   });
}

function createProfile(name, details) {
   console.log(lcarsAPI + "profiles/" + name + "/" + details); 
   /*$.ajax({
           url: lcarsAPI + "profiles/" + name + "/" + details,
           type: 'PUT',
           success: function() { return populateProfiles(); }
   });*/
}


// Gets the recipe to deploy
function getRecipe() {
    $("#deploy-response-recipes").on("click", "td button", function() {
        var recipeID = $(this).closest("tr").find("th").text();
        deployRecipe(recipeID);
    });
}

// Deploys selected recipe
function deployRecipe(rrid) {
    $.getJSON(
      lcarsAPI + "responserecipes/" + rrid,
      function (data, status) {
         if (status === "success") {
            getRules(data);
         }
      });    
}

// Takes array of JSON objects returned by LCARS API and uses it to build the rules to send to the rfw server
function getRules(rules) {
    for (i = 0; i < rules.length; i++) {
        var tar  = rules[i].responsedetails__target.toLowerCase();
        var chn  = rules[i].responsedetails__chain.toLowerCase();
        var prot = rules[i].responsedetails__protocol.toLowerCase();
        var source = rules[i].responsedetails__source.toLowerCase();
        var dest = rules[i].responsedetails__destination.toLowerCase();

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

function viewRecipeDetails() {
    $("#response-recipes").on("click", "td button", function() {
        var button = $(this).text().toLowerCase();
        var rrid = $(this).closest("tr").find("th").text();

        if (button === "view details") {
           getRecipeDetails(rrid);
        }
    });
}    


function getRecipeDetails(rrid) {
    $.getJSON(
      lcarsAPI + "responserecipes/" + rrid,
      function (data, status) {
         if (status === "success") {
           $("#recipe-details").find("tbody").html("");
           $("#recipe-details").find("h4").text("Response Details: " + data[0].responserecipes__name);
           $.each(data, function(i, item) {
              $("#recipe-details").find("tbody").append('<tr><th scope="row">' + data[i].responsedetails__rulenum + '</th>'
                                                      + '<td>' + data[i].responsedetails__target + '</td>'
                                                      + '<td>' + data[i].responsedetails__chain + '</td>'
                                                      + '<td>' + data[i].responsedetails__protocol + '</td>'
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
            $.each(data, function(i, item) {
               $("#response-recipes").append('<tr><th scope="row">' + data[i].responserecipes__rrid + '</th>'
                                           + '<td>' + data[i].responserecipes__name + '</td>'
                                           + '<td>date</td>'
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
            $.each(data, function(i, item) {
               $("#profiles").append('<tr><th scope="row">' + data[i].profiles__pid + '</th>'
                                   + '<td>' + data[i].profiles__name + '</td>'
                                   + '<td>' + data[i].profiles__details + '</td>'
                                   + '<td>' + data[i].profiles__createdate + '</td>'
                                   + '<td><button type="button" class="btn btn-primary btn-xs">Edit</button></td></tr>');
            });
         }
      });
}


$(document).ready(function() {
    getRecipe();
    getButtonClicked();
    populateRecipes();
    populateProfiles();
    viewRecipeDetails();
});

