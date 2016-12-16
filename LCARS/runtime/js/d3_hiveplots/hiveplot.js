
var links = [];
var colorFunc;
var nodes;
var svg;
var nodeMaps = {};
var formData;
var linkWeightMap = new Map();
var info;
var firstRun = true;
window.onload = function(){info = document.getElementById("info");};

// Generates SVG hive plot based on incoming data.
// The incoming data is a Map with the following format:
//    A key "axisConnections" with an array of JSON objects detailing which axis should link to which other (e.g. {"source":"sourceAxis","dest":"destAxis"})
//    A key "axisNames" with an array of strings detailing axis names.
function spawnPlot(formData) {
  
  if(!firstRun){
    // Clear old values
    links = [];
    colorFunc = null;
    nodes = null;
    svg = null;
    nodeMaps = {};
    this.formData = null;
    linkWeightMap = new Map();
  }

  firstRun = false;
  // Make form data accessible to all functions
  this.formData = formData;

  // Use formData to determine how many Maps are needed for the axes.
  formData.get("axisNames").forEach(function(d){
    nodeMaps[d] = new Map(); // Associate each needed map with the name of its corresponding axis.
  });

  // Grab form data from parent frame.
  var logData = currentLog;
  var lines = logData.trim().split("\n");
  // Sets up nodes and links for hive plot.
  // Example JSON: {"src": "1.9.157.132", "src_port": "11155", "dest": "148.100.49.187", "dest_port": "23"}
  // Each line of JSON creates up to 4 different nodes, and up to 3 different links.
  // Each node has:
  //    A type (e.g. src, dest, src_port, dest_port) for determining axis
  //    A y value (normalized between 0 and 1) for placement on the axes
  //    A value (such as an IP address or port)
  //    To sort nodes along the axes, one method may be to sort the incoming JSON data first.
  var maxY = lines.length - 1; // Get the max length for normalization
  if(maxY < 1){
    maxY = 1;
  }

  // Sets up what data goes on what axis. JSON data is placed on an axis corresponding to its key.
  for (var i = 0; i < lines.length; i++){ // For each line of JSON
    if(!lines[i]){continue;}
    jsonLine = JSON.parse(lines[i]);
    // Add to corresponding maps based on data
    formData.get("axisNames").forEach(function(axisName){ // For each axis
       if(nodeMaps[axisName].has(jsonLine[axisName])){ // The mapping already exists, so only add any additional links
        // Check what this node type links to, and add to object
        var linkingAxis = findLink(axisName);
          nodeMaps[axisName].get(jsonLine[axisName]).linksTo.push(jsonLine[linkingAxis]);
       } else { // The mapping does not exist, so create it and add initial links
          var obj = {
            "type": axisName,
            "linksTo": [jsonLine[findLink(axisName)]], 
            "y": ((i) / (maxY)),
            "value": jsonLine[axisName]
          };
          nodeMaps[axisName].set(jsonLine[axisName], obj);
       }
    });
  } // end for loop

  // Populate links array 
  formData.get("axisNames").forEach(function(d){
    genLinks(nodeMaps[d]);
  });

  // Group all the node maps into one array to pass to d3 code
  nodes = [];

  // Populate nodes array
  formData.get("axisNames").forEach(function(d){
    genNodes(nodeMaps[d]);
  });

  genLinkWeight();

  // Debugging printouts:
  // console.log(JSON.stringify(links, null, 4));
  // console.log(nodes);
  // console.log(linkWeightMap);
  // console.log(formData.get("axisConnections"));

  // d3.js code for rendering plot begins here
  var width = 1000,
      height = 700,
      innerRadius = 40,
      outerRadius = 400,
      majorAngle = 2 * Math.PI / 3,
      minorAngle = 1 * Math.PI / 12;
    
  var angleDomain = [] ; // Array for names chosen for axes
  formData.get("axisNames").forEach(function(name){
    angleDomain.push(name);
  });

  //var angle = d3.scale.ordinal().domain(angleDomain).rangePoints([-Math.PI / 2, Math.PI / 2]), change d3.range() in axis creation alongside this

  var angle = d3.scale.ordinal().domain(angleDomain).range([0, majorAngle - minorAngle, majorAngle + minorAngle, 2 * majorAngle]); // change d3.range() in axis creation alongside this
      radius = d3.scale.linear().range([innerRadius + 50, outerRadius - 50]);
      color = d3.scale.ordinal().domain(angleDomain).range(["orange", "red", "teal", "blue"]);
      colorFunc = color; // Give color function global scope

  var scaleLinks = d3.scale.linear().domain([1, getHighestWeight()]).range([1,7]);
  // ordinal scale for legend text positioning
  var legendPos = d3.scale.ordinal().domain(formData.get("axisNames")).range([30,50,70,90]);

  // clear anything in hiveplot div before creating plot
  if(!(svg == null)) {
    svg.selectAll("*").remove();
    d3.select("#svgElement").remove();
  }

  svg = d3.select("#hiveplot").append("svg")
  .attr("width", width)
  .attr("height", height)
  .attr("id","svgElement")
  .append("g")
  .attr("transform", "translate(" + 50 + "," + height / 2 + ")");

  // set up legend for hive plot
  svg.append("g")
  .attr("id","legend")
  .attr("transform","translate(" + 250 + "," + -355 + ")")
  .append("rect")
  .attr("x",10)
  .attr("y",10)
  .attr("width",125)
  .attr("height",100)
  .attr("fill","none")
  .attr("stroke","black");

  d3.select("#legend")
  .selectAll("text")
  .data(formData.get("axisNames"))
  .enter().append("text")
  .attr("x", 30)
  .attr("y", function(d) {return legendPos(d);})
  .attr("font-family", "sans-serif")
  .text(function(d){ return d;})
  .attr("fill", function(d){return color(d);});

  svg.selectAll(".axis")
    .data(angleDomain) // change alongside angle
    .enter().append("line")
    .attr("class", "axis")
    .attr("transform", function(d) {return "rotate(" + degrees(angle(d)) + ")";})
    .attr("x1", radius.range()[0])
    .attr("x2", radius.range()[1]);

  var showWeights = linkWeight;

  if(showWeights.checked){
    if(getHighestWeight > 7){
      svg.selectAll(".link")
        .data(links)
        .enter().append("path")
        .attr("class", "link")
        .style("stroke-width", function(d){
          // Determine width of link by how many times it occurs
          return scaleLinks(linkWeightMap.get(JSON.stringify(d))) + "px";
        })
        .attr("d", d3.hive.link()
              .angle(function(d) {return angle(d.type);})
              .radius(function(d) {return radius(d.y);}))
        .on("mouseover", linkMouseOver)
        .on("mouseout",  mouseout);
    } else { // Don't scale the width, since small numbers will become too large
      svg.selectAll(".link")
        .data(links)
        .enter().append("path")
        .attr("class", "link")
        .style("stroke-width", function(d){
          // Determine width of link by how many times it occurs
          return linkWeightMap.get(JSON.stringify(d)) + "px";
        })
        .attr("d", d3.hive.link()
              .angle(function(d) {return angle(d.type);})
              .radius(function(d) {return radius(d.y);}))
        .on("mouseover", linkMouseOver)
        .on("mouseout",  mouseout);
    }
  } else { // Don't modify the stroke width of the links
    svg.selectAll(".link")
      .data(links)
      .enter().append("path")
      .attr("class", "link")
      .attr("d", d3.hive.link()
            .angle(function(d) {return angle(d.type);})
            .radius(function(d) {return radius(d.y);}))
      .on("mouseover", linkMouseOver)
      .on("mouseout",  mouseout);
  }

  svg.selectAll(".node")
    .data(nodes)
    .enter().append("circle")
    .attr("class", "node")
    .attr("transform", function(d) {return "rotate(" + degrees(angle(d.type)) + ")";})
    .attr("cx", function(d) {return radius(d.y);})
    .attr("r", 5)
    .style("fill", function(d) {return color(d.type);})
    .on("mouseover", nodeMouseover)
    .on("mouseout",  mouseout);
}

function degrees(radians) {
  return radians / Math.PI * 180 - 90;
}

// Link and node highlighting code
function linkMouseOver(d){
  svg.selectAll(".link").classed("active", function(p) { return p === d; });
  svg.selectAll(".node").classed("active", function(p) { return p === d.source || p === d.target; });
  info.innerHTML = "[" + d.source.type +"] <span style=\"color:" + colorFunc(d.source.type) + "\">" + d.source.value + "</span> TO " + "[" + d.target.type +"] <span style=\"color:" + colorFunc(d.target.type) + "\">" + d.target.value + "<br></span> Times repeated: " + linkWeightMap.get(JSON.stringify(d));
}

function nodeMouseover(d) {
  svg.selectAll(".link").classed("active", function(p) { return p.source === d || p.target === d; });
  d3.select(this).classed("active", true);
  info.innerHTML = "[" + d.type +"] <span style=\"color:" + colorFunc(d.type) + "\">" + d.value + "</span>";
}

// Clear any highlighted nodes or links.
function mouseout() {
  svg.selectAll(".active").classed("active", false);
  info.innerHTML =   "Showing " + nodes.length + " nodes.";
}

// Loops through each value in a given map, and creates links based on the linksTo property of the map.
function genLinks(map){
  map.forEach(function(value){ // For each JSON object in the Map
    value.linksTo.forEach(function(linkKey) { // For each destination node description
      var targetAxis = findLink(value.type); // Get the axis that this axis links to
      if(targetAxis !== ""){
         var targetObject = nodeMaps[targetAxis].get(linkKey); // Now that we have the name of the axis to link to, get the corresponding object.
         var jsonObj = {source: value, target: targetObject}; // Construct a relationship between the linked objects
         links.push(jsonObj);
      }
    });
  });
}

// Loops through each value in a given map, and adds objects to nodes array.
function genNodes(map){
  map.forEach(function(value){
    nodes.push(value);
  });
}

// Given the name of an axis, return what other axis the given axis should link to.
function findLink(axisName){
    var targetLink = ""; 
    // For each axis to axis link in the mapping, check if the given axis name matches the source attribute of the mapping.
    // If so, return the corresponding target link. 
    formData.get("axisConnections").forEach(function(link){ // link is an object of the form {"source":"string", "target":"string"}
      if(link.source === axisName) {
         targetLink = link.target;
      }
    });
    return targetLink;
} 

// Records the number of times a link is repeated in order to determine appropriate link weights.
// A link is represented by its string value given by JSON.stringify()
function genLinkWeight(){
  links.forEach(function(link){
    if(linkWeightMap.has(JSON.stringify(link))){
      linkWeightMap.set(JSON.stringify(link),(linkWeightMap.get(JSON.stringify(link)) + 1)) // Increment counter
    } else {
      linkWeightMap.set(JSON.stringify(link), 1); // Add to map with a base value of 1
    }
  });
}

// Checks link map to get the highest weight
function getHighestWeight(){
  maxWeight = 1;

  linkWeightMap.forEach(function(d){
    if(d > maxWeight)
      maxWeight = d;
  });

  return maxWeight;
}