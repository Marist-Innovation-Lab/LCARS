function getRecipe() {
    $("#response-recipes").on("click", "td button", function() {
        var row = $(this).closest("tr").find("td").map(function() {
                      return $(this).text()
                  }).get();
        var recipe = row[0].trim();
        deployRecipe(recipe);
    });
}

function deployRecipe(recipe) {
    if (recipe === "Close the Doors") {
       randomRuleGenerator(3);
    }
}

function randomRuleGenerator(num) {
    for (i = 0; i < num; i++) {
        targets   = ['accept', 'drop', 'reject'];
        chains    = ['input', 'output', 'forward'];
        protocols = ['all', 'icmp', 'tcp', 'udp'];
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
        
        if (chn === 'forward') {
           var ip2 = buildIP();
           buildAddRequest(tar, chn, prot, ip, ip2);
        } else {
           buildAddRequest(tar, chn, prot, ip, null);
        }
    }
} 

$(document).ready(function() {

    getRecipe();

});

