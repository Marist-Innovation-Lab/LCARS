
function createOrchestration() {
    $("#orchestration-create-btn").click(function () {
        var dataObject = {};
        dataObject["pid"] = $("#orchestration-profile-select").val();
        dataObject["rrid"] = $("#orchestration-recipe-select").val();
        $.ajax({
            url: _lcarsAPI + "orchestration",
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
        _lcarsAPI + "profiles",
        function (data, status) {
            if (status === "success") {
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
        _lcarsAPI + "responserecipes",
        function (data, status) {
            if (status === "success") {
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
        _lcarsAPI + "orchestration",
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
                    if (orchestrationArr[pid] === undefined) {
                        orchestrationArr[pid] = {name: profileName, recipes: {}};
                    }

                    // Put empty array if recipe doesn't exist yet
                    if (orchestrationArr[pid]["recipes"][recipeName] === undefined) {
                        orchestrationArr[pid]["recipes"][recipeName] = [];
                    }
                    // Fill the recipes with recipe details
                    orchestrationArr[pid]["recipes"][recipeName].push(detailsObj);
                });

                $.each(orchestrationArr, function(i, item) {
                    // Iterate through all profiles, skipping undefined ones
                    if (item !== undefined) {
                        var numSteps = 0;
                        var recipeList = "";

                        // Count total response details (# of steps) and format the list of recipe names
                        for (var recipeName in item["recipes"]) {
                            if (numSteps !== 0) {
                                recipeList += ", ";
                            }
                            recipeList += recipeName;
                            numSteps += item["recipes"][recipeName].length;
                        }

                        // Create "Response Orchestration" display HTML
                        $("#orchestration").append('<li>' +
                                                     '<div class="block">' +
                                                       '<div class="tags">' +
                                                         '<a class="tag" title="' + item["name"] + '">' +
                                                           '<span>' + item["name"] + '</span>' +
                                                         '</a>' +
                                                       '</div>' +
                                                       '<div class="block_content">' +
                                                         '<h2 class="title">' +
                                                           '<div class="col-xs-6">' + recipeList + '</div>' +
                                                           '<div class="col-xs-6">' +
                                                             '<button type="button" pid="' + i + '" class="btn btn-default btn-xs"><span title="Edit" class="glyphicon glyphicon-pencil"></span></button>' +
                                                             '<button type="button" pid="' + i + '" class="btn btn-default btn-xs"><span title="Delete" class="glyphicon glyphicon-trash"></span></button>' +
                                                           '</div>' +
                                                         '</h2>' +
                                                         '<br><br>' +
                                                         '<div class="byline">' +
                                                           '<span>'+ numSteps +' steps</span>' +
                                                         '</div>' +
                                                         '<br>' +
                                                       '</div>' +
                                                     '</div>' +
                                                   '</li>');
                        $("#deploy-orchestration").append('<tr><th scope="row" style="display:none;">'+ i + '</th>'   // i is the pid
                                                          + '<td>' + item["name"] + '</td>'
                                                          + '<td style="text-align: center;"><button type="button" class="btn btn-default btn-xs"><span title="Deploy" class="glyphicon glyphicon-new-window"></span></button></td></tr>');

                    }
                });
            }
        }
    );
    createDropdowns();
}

// Handles button click for editing/deleting orchestration
function onOrchestrationActionButtonClick() {
    $("#orchestration").on("click", "li div div h2 button", function () {
        var pid = $(this).attr("pid");
        var action = $(this).children("span").attr("title").toLowerCase();

        if (action === "edit") {
            populateOrchestrationRecipes(pid);
            $("#edit-orchestration-modal").modal();
        } else if (action === "delete") {
            $.ajax({
                url: _lcarsAPI + "orchestration/" + pid,
                type: 'DELETE',
                success: function () {
                    populateOrchestration();
                }
            });
        }
    });
}

// Populates the modal window for editing orchestration
function populateOrchestrationRecipes(pid) {
    $.getJSON(
        _lcarsAPI + "orchestration/" + pid,
        function (data, status) {
            if (data[0].responserecipes__rrid === "") {
                $("#edit-orchestration-modal").modal("toggle");
            }

            if (status === "success") {
                var tableHTML = '<table pid="' + pid + '" class="table"><tr><th colspan="2">Recipe Name</th></tr>';
                $.each(data, function(i, item) {
                    tableHTML += '<tr><td>' + data[i].responserecipes__name + '</td>';
                    tableHTML += '<td><button type="button" pid="' + pid + '" rrid="' + data[i].responserecipes__rrid + '" class="btn btn-default btn-xs"><span title="Delete" class="glyphicon glyphicon-trash"></span></button></td></tr>'
                });
                tableHTML += '</table>';
                $("#edit-orchestration-body").html(tableHTML);
            }
        }
    );
}

// Handles deletion/adding of orchestration record (recipe associated with profile)
function onEditOrchestrationActionButtonClick() {
    $("#edit-orchestration-body").on("click", "table tr td button", function() {
        var action = $(this).children("span").attr("title").toLowerCase();
        var dataObject = {};
        dataObject["pid"] = $("#edit-orchestration-body").children("table").attr("pid");
        dataObject["rrid"] = $(this).closest("tr").find("select").val();

        if (action === "delete") {
            var pid = $(this).attr("pid");
            var rrid = $(this).attr("rrid");
            $.ajax({
                url: _lcarsAPI + "orchestration/" + pid + "/" + rrid,
                type: 'DELETE',
                success: function() {
                    populateOrchestrationRecipes(pid);
                    populateOrchestration();
                }
            });

        } else if (action === "submit") {
            $.ajax({
                url: _lcarsAPI + "orchestration",
                type: 'PUT',
                contentType: 'application/json',
                data: JSON.stringify(dataObject),
                success: function() {
                    populateOrchestrationRecipes(dataObject["pid"]);
                    populateOrchestration();
                }
            });

        } else if (action === "cancel") {
            populateOrchestrationRecipes(dataObject["pid"]);
        }

    });
}

// Create new row and dropdown for adding new recipes to an orchestration
function onOrchestrationAddNewRecipeClick() {
    $("#edit-orchestration-new-btn").click(function() {
        var pid = $("#edit-orchestration-body").children("table").attr("pid");

        var selectHTML = '<tr><td><select>';
        $.getJSON(
            _lcarsAPI + "responserecipes",
            function (data, status) {
                if (status === "success") {
                    var recipesObj = {};
                    $.each(data, function(i, item) {
                        recipesObj[data[i].responserecipes__rrid] = data[i].responserecipes__name;
                    });
                    recipesHTML = buildSelect(recipesObj, '').html();
                    selectHTML += recipesHTML + '</select></td>';
                    selectHTML += '<td><button type="button" class="btn btn-default btn-xs submit-btn"><span title="Submit" class="glyphicon glyphicon-ok"></button>';
                    selectHTML += '<button type="button" class="btn btn-default btn-xs cancel-btn"><span title="Cancel" class="glyphicon glyphicon-remove"></span></button></td></tr>';
                    $("#edit-orchestration-body").children("table").append(selectHTML);
                }
            }
        );
    });
}

// Deploys selected orchestration on Reconfigurator Page
function deployOrchestration() {
    $("#deploy-orchestration").on("click", "td button", function() {
        var pid = $(this).closest("tr").find("th").text();

        $.getJSON(
            _lcarsAPI + "orchestration/" + pid,
            function (data, status) {
                if (status === "success") {
                    $.each(data, function(i, item) {
                        deployResponseRecipe(data[i].responserecipes__rrid);
                    });
                }
            }
        );
    });
}


$(document).ready(function() {
    populateOrchestration();
    createOrchestration();
    onOrchestrationActionButtonClick();
    onEditOrchestrationActionButtonClick();
    onOrchestrationAddNewRecipeClick();
    deployOrchestration();
});
