
// Capitalizes first letter of word
String.prototype.capitalize = function () {
    var rawString = this.toLowerCase();
    var result = rawString.charAt(0).toUpperCase() + rawString.substr(1);
    return result;
}

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


var serverURL = "http://10.10.7.84:7390/"

// This will not work if your IP is not whitelisted
// The entire marist network: 10.0.0.0/8 is currently whitelisted for testing
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


function refreshFirewall() {
    getFirewallData();   
}

$(document).ready(function() {
    $("#target-dropdown").on("click", "li a", function() {
        var target = $(this).text();
        $("#target-title").text(target);
    });
    $("#chain-dropdown").on("click", "li a", function() {
        var chain = $(this).text();
        $("#chain-title").text(chain);
    });
    $("#protocol-dropdown").on("click", "li a", function() {
        var protocol = $(this).text();
        $("#protocol-title").text(protocol);
    });
//  $("#interface-dropdown").on("click", "li a", function() {
//      var interface = $(this).text();
//      $("#interface-title").text(interface);
//  });

    $("#add-rule").on("click", function() {
        var target = $("#target-title").text().toLowerCase().trim();
        var chain = $("#chain-title").text().toLowerCase().trim();
        var protocol = $("#protocol-title").text().toLowerCase().trim();
//      var interface = $("#interface-title").text().toLowerCase().trim();
        var addr = $("#address").val();
//      buildAddRequest(target, chain, protocol, interface, addr);
        buildAddRequest(target, chain, protocol, addr);
    });

    $("#firewall-rules").on("click", "td button", function() {
        var button = $(this).text().toLowerCase();
        var row = $(this).closest("tr").find("td").map(function() {
                      return $(this).text()
                  }).get();

        if (button === "delete") {
            buildDeleteRequest(row);
        }
    });
 
    getWhitelist();
});

function addRuleErrorMsg() {
    $("#addrule-error").text("Invalid Request");
}

//function buildRequest(target, chain, protocol, interface, address) {
function buildAddRequest(target, chain, protocol, address) {

//  if ( target === "target" || chain === "chain" || protocol === "protocol" || interface === "interface" ) {
    if ( target === "target" || chain === "chain" || protocol === "protocol" ) {
        return addRuleErrorMsg();        
    } else {
//      var path = serverURL + target + "/" + chain + "/" + interface + "/" + protocol + "/" + address;
        var path = serverURL + target + "/" + chain + "/any/" + protocol + "/" + address;
        return addNewRule(path);
    }
}

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

function buildDeleteRequest(rule) {
    var target = rule[0].toLowerCase();
    var chain = rule[1].toLowerCase();
    var prot = rule[2].toLowerCase();
    var source = rule[3].toLowerCase();
    var dest = rule[4].toLowerCase();

    if (chain === "input") {
        var path = serverURL + target + "/" + chain + "/any/" + prot + "/" + source;
    } else {
        var path = serverURL + target + "/" + chain + "/any/" + prot + "/" + dest;
    }
    
   return deleteRule(path);
}

function deleteRule(URL) {
    $.ajax({
            url: URL,
            type: 'DELETE',
            success: function() {
                return location.reload();
            }
    });

}


