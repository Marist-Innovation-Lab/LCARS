
var lcarsAPI = "http://10.10.7.84:8081/"

function viewLogs() {
    $("#honeypots").on("click", "td button", function() {

        clearModal();        

        // Gets the text of the button that was clicked to determine which it was
        var button = $(this).children("span").attr("title").toLowerCase(); 
        var host = $(this).closest("tr").find("td:nth-child(2)").text();
        var type = $(this).closest("tr").find("td:nth-child(3)").text();

        if (button === "view") {        
            $("#log-modal").find("h4").text("Today's Log Data for " + type + " Honeypot: " + host);

            $("#log-data").load("/lcars/runtime/logs/"+host.toLowerCase()+".log");
        }
    });

}

function clearModal() {
    $(".modal").on("hidden.bs.modal", function() {
        $("log-data").html("");
    });
}


// Get the time each honeypot was last attacked
function getTimeLastAttacked() {
    $.getJSON(
       lcarsAPI + "hpattacktime",
       function (data, status) {
          if (status === "success") {

              hpTable = $("#honeypots tr");
              for (var i = 0; i < data.length; i++) {
                  hpTable.each( function() {
                      hpTableHostname = $(this).find("td:nth-child(2)").text();
                      hpTableLastAttacked = $(this).find("td:nth-child(5)");
                      hostname = data[i].hostname;
                      time = data[i].time;
                      if (hpTableHostname === hostname) {
                          hpTableLastAttacked.html(time);
                      }
                  });
              }

          }
       }
    );
}


function setLogsLastRefreshedTime() {
   var date = new Date();
   var mins = date.getMinutes();
   var hours = date.getHours();
   
   function refreshed(time) {
       $("#last-refreshed").html("Last refreshed: Today at " + time);
   }

   if (mins < 20) {
      refreshed(hours + ":00:00");
   } else if (mins < 40) {
      refreshed(hours + ":20:00");
   } else {
      refreshed(hours + ":40:00");
   }
}


// Refreshes Longtail image every one minute. The actual image itself refreshes every 5 minutes on Longtail's site,
// but if we set it to every 5 minutes here as well, the cycle is more likely to start at something other than 
// a :00 or :05 time, making the image still 1-4 minutes off
function refreshLongtailImage() {
    // The ? + Math.random() appended to the URL below allows the image to actually refresh, without it the browser recognizes
    // that the URL path is the same and won't grab the new image from the Longtail site     
    $("#longtail-img").attr("src", "http://longtail.it.marist.edu/honey/dashboard_number_of_attacks.png?"+Math.random());
}


$(document).ready(function() {
    viewLogs();
    getTimeLastAttacked();
    setLogsLastRefreshedTime();
});

setInterval('refreshLongtailImage()', 60000);


