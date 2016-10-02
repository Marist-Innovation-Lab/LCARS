/*
 *  firewall.js - functions involved with the interaction of the firewall
 *
 *  API requests will not work unless your machine's IP is whitelisted
 *  The entire Marist network, 10.0.0.0/8 & 148.100.0.0/16, is whitelisted for testing
 */
 
 
var serverURL = "http://10.10.7.84:7390/"

// Sends a request to the server to get the current firewall rules and builds out the "Firewall State" table with the data
function getFirewallData() {
    $.getJSON(
      serverURL + "list",
      function (data, status) {
         if (status === "success") {
             $("#firewall-rules").empty();
             $.each(data, function(i, item) { 
                 $("#firewall-rules").append('<tr><th scope="row">' + data[i].num + '</th>'
                                           + '<td>' + data[i].target.capitalize() + '</td>'
                                           + '<td>' + data[i].chain.capitalize() + '</td>'
                                           + '<td>' + data[i].prot.formatProtocol() + '</td>'
                                           + '<td>' + data[i].source + '</td>'
                                           + '<td>' + data[i].destination + '</td>'
                                           + '<td><button type="button" class="btn btn-primary btn-xs">Edit</button>'
                                           + '<button type="button" class="btn btn-primary btn-xs">Delete</button></td></tr>');
             });
         }
      });
}

// Sends a request to the server to get the whitelisted IPs and adds them to the "Whitelist" section
function getWhitelist() {
    $.getJSON(
      serverURL + "whitelist",
      function (data, status) {
         if (status === "success") {
             $.each(data, function(i, item) {
                 $("#whitelist").append('<tr><th scope="row">' + data[i] + '</th></tr>');
             });
         }
      });
}

// Gets the selected value of the rule attribute dropdowns menus
function getDropdownSelection(attribute) {
    $("#"+attribute+"-dropdown").on("click", "li a", function() {
        var attr = $(this).text();
        $("#"+attribute+"-title").text(attr);
    });
}

// Determines if "Add rule" button was clicked, and gets the values to build rule
function addButtonClicked() {
    $("#add-rule").on("click", function() {
        var target = $("#target-title").text().toLowerCase().trim();
        var chain = $("#chain-title").text().toLowerCase().trim();
        var protocol = $("#protocol-title").text().toLowerCase().trim();
//      var interface = $("#interface-title").text().toLowerCase().trim();
        var addr = $("#address").val();

//      buildAddRequest(target, chain, protocol, interface, addr);
        buildAddRequest(target, chain, protocol, addr);
    });
}

// Alerts the user that they issued an invalid request
function addRuleErrorMsg() {
    $("#addrule-error").text("Invalid Request");
}

// Builds request URL to add new rule
//function buildAddRequest(target, chain, protocol, interface, address) {
function buildAddRequest(target, chain, protocol, address) {

//  if ( target === "target" || chain === "chain" || protocol === "protocol" || interface === "interface" ) {
    if ( target === "target" || chain === "chain" || protocol === "protocol" || address === "") {
        return addRuleErrorMsg();        
    } else {
//      var path = serverURL + target + "/" + chain + "/" + interface + "/" + protocol + "/" + address;
        var path = serverURL + target + "/" + chain + "/any/" + protocol + "/" + address;
        return addNewRule(path);
    }
}

// Sends ajax request to add new rule
function addNewRule(URL) {
    $.ajax({
            url: URL,
            type: 'PUT',
            success: function() {
                return location.reload();
            },
            error: function() {
                return addRuleErrorMsg();
            }
    });
}

// Determines if the "Edit" or "Delete" button in the Firewall Rules section was pressed and performs the appropriate action
function getRuleAction() {
    $("#firewall-rules").on("click", "td button", function() {
        var button = $(this).text().toLowerCase();
        // Gets rule values
        var row = $(this).closest("tr").find("td").map(function() {
                      return $(this).text()
                  }).get();

        if (button === "delete") {
            buildDeleteRequest(row);
        }
    });
}

// Builds request URL to delete selected rule
function buildDeleteRequest(rule) {
    var target = rule[0].toLowerCase();
    var chain  = rule[1].toLowerCase();
    var prot   = rule[2].toLowerCase();
    var source = rule[3].toLowerCase();
    var dest   = rule[4].toLowerCase();

    if (chain === "input") {
        var path = serverURL + target + "/" + chain + "/any/" + prot + "/" + source;
    } else {  // chain === "output"
        var path = serverURL + target + "/" + chain + "/any/" + prot + "/" + dest;
    }
    
   return deleteRule(path);
}

// Sends ajax request to delete selected rule
function deleteRule(URL) {
    $.ajax({
            url: URL,
            type: 'DELETE',
            success: function() {
                return location.reload();
            }
    });
}


$(document).ready(function() {

    getDropdownSelection("target");
    getDropdownSelection("chain");
    getDropdownSelection("protocol");   
//  getDropdownSelection("interface");

    addButtonClicked();

    getRuleAction();
    
    getFirewallData();
    getWhitelist();
    
});


/*
 * The following two functions are used to enrich the text in the Firewall State table
 */ 

// Capitalizes first letter of a string
String.prototype.capitalize = function () {
    var rawString = this.toLowerCase();
    var result = rawString.charAt(0).toUpperCase() + rawString.substr(1);
    return result;
}

// Used to format protocol value - "All" is capitalized, whereas the rest are uppercased
String.prototype.formatProtocol = function () {
    var rawString = this.toLowerCase();
    var result;
    if (rawString === "all") {
        result = rawString.capitalize();
    } else {
        result = rawString.toUpperCase();
    }
    return result;
}
