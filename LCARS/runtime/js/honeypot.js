
var lcarsAPI = "http://10.10.7.84:8081/";
var currentLog = "";
var honeypot_settings_html = `<p><b>Settings</b></p>
Number of axes: 
<select id="numAxes" onchange="genAxisNameSelectors()">
  <option value="2">2</option>
  <option value="3">3</option>
  <option value="4">4</option>
</select>
<br>
Axis names:
<span id="axisNames"></span>
<br>
Axis connections:
<br>
<span id="connections"></span>
<br>
<input type="checkbox" id="linkWeight" checked> Show link weights <br>
<a type="button" class="btn btn-primary" onclick="makePlot()" data-dismiss="modal">Plot</a>`;

function viewHoneypotLogs() {
    $("#honeypots").on("click", "td button", function() {

        clearModal();        

        // Gets the text of the button that was clicked to determine which it was
        var button = $(this).children("span").attr("title").toLowerCase();
        var host = $(this).closest("tr").find("td:nth-child(2)").text();
        var type = $(this).closest("tr").find("td:nth-child(3)").text();

        if (button === "view") {        
            $("#log-modal").find("h4").text("Today's Log Data for " + type + " Honeypot: " + host);
            $("#log-identifier").html(host.toLowerCase());
    
            $("#log-data").load("/lcars/runtime/logs/longtail/"+host.toLowerCase()+".log");
        }

        if(button === "plot") {
          $("#plot-modal").find("h4").text("Settings for hive plot:");
          $("#plot-data").html(honeypot_settings_html);
          $.get("/lcars/runtime/logs/"+host.toLowerCase()+".log", function(x){
            currentLog = x;
            console.log(x);
          });
          genAxisNameSelectors();

        }

        if(button === "to graph") {
          $("#log-modal").find("h4").text("Settings for graph:");

        }
    });

}

function viewBlackridgeLogs() {
    $("#blackridge").on("click", "td button", function() {

        clearModal();

        // Gets the text of the button that was clicked to determine which it was
        var button = $(this).children("span").attr("title").toLowerCase();
        var host = $(this).closest("tr").find("td:nth-child(2)").text();
        var date = $(this).closest("tr").find("select").val();

        if (button === "view") {
            $("#log-modal").find("h4").text(date + " BlackRidge Log Data for: " + host);
            $("#log-identifier").html(date);

            $("#log-data").load("/lcars/runtime/logs/blackridge/" + date);
        }

        if(button === "plot") {
          $("#log-modal").find("h4").text("Settings for hive plot:");

        }

        if(button === "to graph") {
          $("#log-modal").find("h4").text("Settings for graph:");

        }
    });

}


function viewParsedLogs() {
    $("#data-view").on("click", function() {
        var id = $("#log-identifier").text();
        var parsedFile;
        var rawFile;
        
        // Longtail Log
        if (id.match(/[A-Za-z]+/g)) {
            parsedFile = "/lcars/runtime/logs/longtail/parsed_json/"+id+".log.json";   
            rawFile = "/lcars/runtime/logs/longtail/"+id+".log";
        // BlackRidge Log
        } else {
            parsedFile = "/lcars/runtime/logs/blackridge/parsed_json/"+id+".json";
            rawFile = "/lcars/runtime/logs/blackridge/"+id;
        }

        if ($(this).text() === "View Parsed") {
            $(this).html("View Raw");
            $("#log-data").load(parsedFile);
        }
        else if ($(this).text() === "View Raw") {
            $(this).html("View Parsed");
            $("#log-data").load(rawFile);
        }
    });
}


function clearModal() {
    $(".modal").on("hidden.bs.modal", function() {
        $("#log-data").html("");
        $("#data-view").html("View Parsed");
    });
}


// Get the time each honeypot was last attacked
function getTimeLastAttacked() {
    $.getJSON(
       lcarsAPI + "hpattacktime",
       function (data, status) {
          if (status === "success") {

              $.each(data, function(i, item) {
                  var hostname = data[i].hostname;
                  var loc;
                  if (hostname.includes("AWS")) {
                      loc = "AWS Cloud";
                  } else {
                      loc = "Marist";
                  }
 
                  $("#honeypots").append('<tr><th scope="row">' + (i+1) + '</th>'
                                       + '<td>' + hostname + '</td>'
                                       + '<td>SSH</td>'
                                       + '<td>' + loc + '</td>'
                                       + '<td>' + data[i].time + '</td>'
                                       + '<td>'
                                         + '<button type="button" class="btn btn-default btn-xs" data-toggle="modal" data-target="#log-modal"><span title="View" class="glyphicon glyphicon-list"></span></button>'
                                         + '<button type="button" class="btn btn-default btn-xs" data-toggle="modal" data-target="#plot-modal"><span title="Plot" class="fa fa-share-alt"</span></button>'
                                         + '<button type="button" class="btn btn-default btn-xs"><span title="To Graph" class="fa fa-line-chart"</span></button>'
                                       + '</td></tr>');

              });

          }
       }
    );
}


function setLogsLastRefreshedTime() {
   var date = new Date();
   var mins = date.getMinutes();
   var currentHour = date.getHours();
   var lastHour;
   var day;

   if (currentHour == 00 && mins < 15) {
      lastHour = 23;
      day = "Yesterday";
   } else {
      lastHour = currentHour - 1;
      day = "Today";
   } 

   function refreshed(time) {
       $("#last-refreshed").html("Last refreshed: " + day + " at " + time);
   }

   if (mins < 15) {
      refreshed(lastHour + ":15:00");
   } else {
      refreshed(currentHour + ":15:00");
   }
}


function refreshLongtailImage() {
    // The ? + Math.random() appended to the URL below allows the image to actually refresh, without it the browser recognizes
    // that the URL path is the same and won't grab the new image from the Longtail site     
    $("#longtail-img").attr("src", "http://longtail.it.marist.edu/honey/dashboard_number_of_attacks.png?"+Math.random());
}


function switchLogTab() {
    $('#logs-tab a').click(function (e) {
        e.preventDefault()
        $(this).tab('show')
    })
}

$(document).ready(function() {
    viewHoneypotLogs();
    viewBlackridgeLogs();
    viewParsedLogs();
    getTimeLastAttacked();
    setLogsLastRefreshedTime();

    // Call functions to refresh logs every hour on the 15 minute (thats when the cron job runs)
    setIntervalAdapted(getTimeLastAttacked, 60, 905);
    setIntervalAdapted(setLogsLastRefreshedTime, 60, 905);
    setIntervalAdapted(refreshLongtailImage, 5, 5);

    switchLogTab();
});


/** 
 * An adaptation of the built in setInterval function - Runs a function at a specified interval on the interval
 * Main purpose is to sync page refresh with cron job in honeypot logs table
 * Example: setIntervalAdapted(func, 20) will run func() every 20 minutes on the 20 minute mark (:00, :20, and :40)
 * @param minuteInterval - interval (in minutes) in which function will run
 * @param [secondsOffset=0] - an optional parameter that allows you to specify a number of seconds after hh:mm:00 to start timeout, defaults to hh:mm:00  
 * http://stackoverflow.com/questions/28532731/how-to-run-a-javascript-function-every-10-minutes-specifically-on-the-10-minute
 */
function setIntervalAdapted(myFunction, minuteInterval, secondsOffset) {
    var date = new Date();
    var currentSeconds = (date.getMinutes() * 60) + (date.getSeconds());
    // converts the specified interval to seconds
    var interval = minuteInterval * 60;
    var secondsSinceLastTimerTrigger;
    var secondsUntilNextTimerTrigger;
    // set offset to 0 if none specified
    if (typeof secondsOffset === 'undefined') { secondsOffset = 0; }

    if (minuteInterval === 60 && secondsOffset > 0) {
        if (currentSeconds < secondsOffset) {
            secondsUntilNextTimerTrigger = secondsOffset - seconds;
        } else {
            secondsUntilNextTimerTrigger = (interval - currentSeconds) + secondsOffset;
        }
    } else {
        secondsSinceLastTimerTrigger = currentSeconds % interval;
        secondsUntilNextTimerTrigger = interval - secondsSinceLastTimerTrigger + secondsOffset;
    }

    // If current time is :33 and the interval is 20, timeout needs to be set to run the function once time reaches :40
    // And then call the built in setInterval to execute the function every 20 minutes from this point
    setTimeout(function() {
        setInterval(myFunction, interval*1000); // *1000 converts back to milliseconds
        myFunction();
    }, secondsUntilNextTimerTrigger*1000);
}

