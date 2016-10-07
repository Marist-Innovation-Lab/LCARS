
// rules is an array of JSON objects used to simulate data that will eventually be drawn from the database
// Format is like this: rules = [ {"rulenum": 1, "target": "drop", "chain": "input", "protocol": "tcp", "source": "1.2.3.4", "destination": "0.0.0.0"}, {"rulenum": 2, "target": "drop", "chain": "input", "protocol": "icmp", "source": "4.3.2.1", "destination": "0.0.0.0"} ] 
rules = randomRuleGenerator(5);

// Gets the recipe associated with button clicked
function getRecipe() {
    $("#response-recipes").on("click", "td button", function() {
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
});

