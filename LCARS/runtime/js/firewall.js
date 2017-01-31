/*
 *  firewall.js - functions involved with the interaction of the firewall
 *
 *  API requests will not work unless your machine's IP is whitelisted
 *  The entire Marist network, 10.0.0.0/8 & 148.100.0.0/16, is whitelisted for testing
 */
 

// Sends a request to the server to get the current firewall rules and builds out the "Firewall State" table with the data
function getFirewallData() {
    $.getJSON(
      _rfwAPI + "list",
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
                                           + '<td style="text-align: center;"><button type="button" class="btn btn-default btn-xs"><span class="glyphicon glyphicon-trash"></span><span class="sr-only">Delete</span></button></td></tr>');
             });
         }
      });
}

// Sends a request to the server to get the whitelisted IPs and adds them to the "Whitelist" section
function getWhitelist() {
    $.getJSON(
      _rfwAPI + "whitelist",
      function (data, status) {
         if (status === "success") {
             $.each(data, function(i, item) {
                 $("#whitelist").append('<tr><th scope="row">' + data[i] + '</th></tr>');
             });
         }
      });
}

// Sends a request to the server for the whitelist and firewall rules (getWhitelist() & getFirewallRules())
// Used when page is reloaded-- server was having trouble handling the two separate getJSON requests at once, but handles them fine when nested
function initPage() {
    $.getJSON(
      _rfwAPI + "list",
      function (listData) {
          $.getJSON(
             _rfwAPI + "whitelist",
             function (whitelistData) {
                 $.each(whitelistData, function(i, item) {
                     $("#whitelist").append('<tr><th scope="row">' + whitelistData[i] + '</th></tr>');
                 });
              
                 $("#firewall-rules").empty();
                 $.each(listData, function(i, item) {
                     $("#firewall-rules").append('<tr><th scope="row">' + listData[i].num + '</th>'
                                           + '<td>' + listData[i].target.capitalize() + '</td>'
                                           + '<td>' + listData[i].chain.capitalize() + '</td>'
                                           + '<td>' + listData[i].prot.formatProtocol() + '</td>'
                                           + '<td>' + listData[i].source + '</td>'
                                           + '<td>' + listData[i].destination + '</td>'
                                           + '<td><button type="button" class="btn btn-primary btn-xs">Delete</button></td></tr>');
                 });
             })
      });
}

// Gets the selected value of the rule attribute dropdowns menus
function getDropdownSelection(attribute) {
    $("#"+attribute+"-dropdown").on("click", "li a", function() {
        var attr = $(this).text();
        $("#"+attribute+"-title").text(attr);
        
        if (attribute === "chain") {
            if (attr === "Forward ") {
                addressBoxes(2);
            } else {
                addressBoxes(1);
            }
        }
    });
}

// Resets Firewall Rules panel inputs to default values
function resetDropdownSelections() {
    $("#target-title").text("Title ");
    $("#chain-title").text("Chain ");
    $("#protocol-title").text("Protocol ");
    $("#address").val("");
    $("#address2").val("");
    $("#addrule-error").text("");    
}

// Reconfigures IP address input boxes if forward chain is selected
function addressBoxes(num) {
    if (num === 2) {
        $("#address-inputs").empty();
        $("#address-inputs").append('<div class="col-lg-6"><input type="text" id="address" class="form-control" placeholder="Source IP"></div>');
        $("#address-inputs").append('<div class="col-lg-6"><input type="text" id="address2" class="form-control" placeholder="Destination IP"></div>');
    } else {
        $("#address-inputs").empty();
        $("#address-inputs").append('<input type="text" id="address" class="form-control" placeholder="IP address">');
    }
}

// Determines if "Add rule" button was clicked, and gets the values to build rule
function addButtonClicked() {
    $("#add-rule").on("click", function() {
        var target = $("#target-title").text().toLowerCase().trim();
        var chain = $("#chain-title").text().toLowerCase().trim();
        var protocol = $("#protocol-title").text().toLowerCase().trim();
//      var interface = $("#interface-title").text().toLowerCase().trim();
        var addr = $("#address").val();
        var addr2 = null;        

        if (chain === "forward") {
            addr2 = $("#address2").val();
        }

//      buildAddRequest(target, chain, protocol, interface, addr);
        buildAddRequest(target, chain, protocol, addr, addr2);
    });
}

// Alerts the user that they issued an invalid request
function addRuleErrorMsg() {
    $("#addrule-error").text("Invalid Request");
}

// Builds request URL to add new rule
//function buildAddRequest(target, chain, protocol, interface, address) {
function buildAddRequest(target, chain, protocol, address, address2) {

//  if ( target === "target" || chain === "chain" || protocol === "protocol" || interface === "interface" ) {
    if ( target === "target" || chain === "chain" || protocol === "protocol" || address === "") {
        return addRuleErrorMsg();
    } else if ( chain === "forward" ) {
        var path = _rfwAPI + target + "/forward/any/" + protocol + "/" + address + "/any/" + address2;
        return addNewRule(path);                
    } else {
//      var path = serverURL + target + "/" + chain + "/" + interface + "/" + protocol + "/" + address;
        var path = _rfwAPI + target + "/" + chain + "/any/" + protocol + "/" + address;
        return addNewRule(path);
    }
    updateLog(path);
}

// Sends ajax request to add new rule
function addNewRule(URL) {
    // var first = (new Date()).getTime();
    $.ajax({
            url: URL,
            type: 'PUT',
            success: function() {
                // console.log("Milliseconds for request: " + ((new Date()).getTime() - first));
                updateLog("Add", URL);
                resetDropdownSelections();
                return getFirewallData();
            },
            error: function() {
                return addRuleErrorMsg();
            }
    });
}

function updateLog(action, update) {
    var formattedUpdate = formatLogData(update);
    var date = (new Date()).toString().split(' ').splice(1,4).join(' ');
    $("#reconf-log").append("[" + date + "] Action: " + action + "; " + formattedUpdate + "<br>");

}

function formatLogData(entry) {
    var rawAPIStr = entry.substring(23, entry.length);
    var splitStr = rawAPIStr.split("/");
    var target = splitStr[0].capitalize();
    var chain = splitStr[1].capitalize();
    var protocol = splitStr[3].formatProtocol();
    var ip = splitStr[4];

    if (chain === "Input") {
        var formattedData = "Target: " + target + "; Chain: " + chain + "; Protocol: " + protocol + "; Source: " + ip + "; Destination: 0.0.0.0/0";
    } else if (chain === "Output") {
        var formattedData = "Target: " + target + "; Chain: " + chain + "; Protocol: " + protocol + "; Source: 0.0.0.0/0; Destination: " + ip;
    } else if (chain === "Forward") {
        var ip2 = splitStr[6];
        var formattedData = "Target: " + target + "; Chain: " + chain + "; Protocol: " + protocol + "; Source: " + ip + "; Destination: " + ip2;
    }
    return formattedData;
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
    var path;

    if (chain === "input") {
        path = _rfwAPI + target + "/input/any/" + prot + "/" + source;
    } else if (chain === "output") { 
        path = _rfwAPI + target + "/output/any/" + prot + "/" + dest;
    } else {   // chain === "forward"
        if (dest === "0.0.0.0/0") {
            path = _rfwAPI + target + "/forward/any/" + prot + "/" + source + "/any/"
        } else {
            path = _rfwAPI + target + "/forward/any/" + prot + "/" + source + "/any/" + dest;
        }
    }
    
   return deleteRule(path);
}

// Sends ajax request to delete selected rule
function deleteRule(URL) {
    $.ajax({
            url: URL,
            type: 'DELETE',
            success: function() {
                updateLog("Delete", URL);
                return getFirewallData();
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
//    initPage();
 
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
