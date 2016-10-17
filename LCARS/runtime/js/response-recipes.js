
var lcarsAPI = "http://10.10.7.84:8081/"

// rules is an array of JSON objects used to simulate data that will eventually be drawn from the database
// Format is like this: rules = [ {"rulenum": 1, "target": "drop", "chain": "input", "protocol": "tcp", "source": "1.2.3.4", "destination": "0.0.0.0"}, {"rulenum": 2, "target": "drop", "chain": "input", "protocol": "icmp", "source": "4.3.2.1", "destination": "0.0.0.0"} ] 
//rules = randomRuleGenerator(5);

// Gets the recipe associated with button clicked
function getRecipe() {
    $("#deploy-response-recipes").on("click", "td button", function() {
        var row = $(this).closest("tr").find("td").map(function() {
                      return $(this).text()
                  }).get();
        var recipe = row[0].trim();
        deployRecipe(recipe);
    });
}

// Deploys selected recipe
function deployRecipe(recipe) {
    if (recipe === "Close the Doors") {
       rules = randomRuleGenerator(5);
       getRules(rules);
    }
}

// Takes array of JSON objects and uses it to build the rules to send to the server
function getRules(rules) {
    for (i = 0; i < rules.length; i++) {
        var tar  = rules[i].target.toLowerCase();
        var chn  = rules[i].chain.toLowerCase();
        var prot = rules[i].protocol.toLowerCase();
        var source = rules[i].source.toLowerCase();
        var dest = rules[i].destination.toLowerCase();

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
                                           + '<td><button type="button" class="btn btn-primary btn-xs">Edit</button></td></tr>');
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

// Basically useless function used to generate array of JSON objects used for testing
// (Was too lazy to think up a bunch of random rules myself)
function randomRuleGenerator(num) {
    rules = [];
    for (i = 0; i < num; i++) {
        targets   = ["accept", "drop", "reject"];
        chains    = ["input", "output", "forward"];
        protocols = ["all", "icmp", "tcp", "udp"];
        var tar  = targets[Math.floor(Math.random() * targets.length)];
        var chn  = chains[Math.floor(Math.random() * chains.length)];
        var prot = protocols[Math.floor(Math.random() * protocols.length)];
   
        function buildIP() {
            segments = [];
            for (j = 0; j < 4; j++) {
                segments[j] = Math.floor(Math.random() * 255) + 1;
            }
            return segments[0] + "." + segments[1] + "." + segments[2] + "." + segments[3]; 
        }

        var ip = buildIP();
        
        if (chn === "input") { 
           var rule = {"rulenum": i, "target": tar, "chain": chn, "protocol": prot, "source": ip, "destination": "0.0.0.0"};
        } else if (chn === "output") {
           var rule = {"rulenum": i, "target": tar, "chain": chn, "protocol": prot, "source": "0.0.0.0", "destination": ip};
        } else if (chn === "forward") {
           var ip2 = buildIP();
           var rule = {"rulenum": i, "target": tar, "chain": chn, "protocol": prot, "source": ip, "destination": ip2};
        }
        rules.push(rule);
    }
    return rules;
} 

$(document).ready(function() {
    getRecipe();
    populateRecipes();
    populateProfiles();
});

