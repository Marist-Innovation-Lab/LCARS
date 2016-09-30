
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

// This will not work if your IP is not whitelisted
// The entire marist network: 10.0.0.0/8 is currently whitelisted for testing
function getData() {
    $.getJSON(
      "http://10.10.7.84:7390/list",
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

function refreshFirewall() {
    getData();   
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

    $("#add-rule").on("click", function() {
        var target = $("#target-title").text().toLowerCase().trim();
        var chain = $("#chain-title").text().toLowerCase().trim();
        var addr = $("#address").val();
        buildRequest(target, chain, addr);
    });
 

});

function addRuleErrorMsg() {
    $("#addrule-error").text("Invalid Request");
}

function buildRequest(target, chain, address) {
    var url = "http://10.10.7.84:7390/"

    if ( target === "target" || chain === "chain" ) {
        return addRuleErrorMsg();        
    } else {
        var path = url + target + "/" + chain + "/any/" + address;
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


