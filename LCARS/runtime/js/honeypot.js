
var lcarsAPI = "http://10.10.7.84:8081/";
var gstarAddress = "http://10.10.7.84/gstarstudio"
var currentLog = "";

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
          $.get("/lcars/runtime/logs/longtail/parsed_json/"+host.toLowerCase()+".log.json", function(x){
            currentLog = x;
          },'html');

          // $("#plot-modal").find("h4").text("Settings for hive plot:");
          // $("#plot-data").html(hiveplot_settings_html);
          // genAxisNameSelectors();
        }

        if(button === "to graph") {
          $.get("/lcars/runtime/logs/longtail/parsed_json/"+host.toLowerCase()+".log.json", function(x){
            makeGraph(x);
          },'html');

          // $("#graph-modal").find("h4").text("Settings for graph:");
          // $("#graph-data").html(graph_settings_html);
          // genAxisNameSelectors();
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
          $.get("/lcars/runtime/logs/blackridge/parsed_json/"+host.toLowerCase()+".log.json", function(x){
            currentLog = x;
          },'html');

          // $("#plot-modal").find("h4").text("Settings for hive plot:");
          // $("#plot-data").html(hiveplot_settings_html);
          // genAxisNameSelectors();
        }

        if(button === "to graph") {
          $.get("/lcars/runtime/logs/blackridge/parsed_json/"+host.toLowerCase()+".log.json", function(x){
            currentLog = x;
          },'html');

          // $("#graph-modal").find("h4").text("Settings for graph:");
          // $("#graph-data").html(graph_settings_html);
          // genAxisNameSelectors();
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

    // Attempt to call function every hour on the 15 minute but its broken :(
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
    var currentSeconds = new Date().getTime() / 1000; // / 1000 converts time from milliseconds to seconds
    // converts the specified interval to seconds
    var interval = minuteInterval * 60;
    // set offset to 0 if none specified
    if (typeof secondsOffset === 'undefined') { secondsOffset = 0; }    
    var secondsSinceLastTimerTrigger = currentSeconds % interval;
    var secondsUntilNextTimerTrigger = interval - secondsSinceLastTimerTrigger + secondsOffset;
    
    // If current time is :33 and the interval is 20, timeout needs to be set to run the function once time reaches :40
    // And then call the built in setInterval to execute the function every 20 minutes from this point
    setTimeout(function() {
        setInterval(myFunction, interval*1000); // *1000 converts back to milliseconds
        myFunction();
    }, secondsUntilNextTimerTrigger*1000);
}

// Creates gstar plot based on log data
function makeGraph(data){
    // var gstarWnd = window.open(gstarAddress);
    // var gstarTextArea = gstarWnd.document.getElementById("ace_content");
    var output = document.getElementById("logDataOutput");
    var lines = data.split("\n");
    var dataKeys = JSON.parse(lines[0]).keys();
    var jsonLine;
    var colorScale = d3.scale.category10()
    var colors = {};

    dataKeys.forEach(function(key){
      colors[key] = colorScale();
    });
    console.log(colors)

    output.innerHTML = "";
    output.innerHTML = output.innerHTML + "new graph<br>";

    for (var i = 0; i < lines.length; i++){
      jsonLine = JSON.parse(lines[i]);
      dataKeys.forEach(function(key){
        output.innerHTML = output.innerHTML + "add vertex " + jsonLine[key] + " with attributes(color=" + colors[key] + ")" + "<br>";
      });
    }

    for (var i = 0; i < lines.length; i++) {
      jsonLine = JSON.parse(lines[i]);
      for (var j = 0; j < dataKeys.length - 1; j++){
        output.innerHTML = output.innerHTML + "add edge " + jsonLine[dataKeys[j]] + " - " + jsonLine[dataKeys[j + 1]] + "<br>";
      }
    }
}