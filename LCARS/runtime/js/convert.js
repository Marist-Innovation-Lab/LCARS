function convertToGstar() {
	
	var logData = document.getElementById("logData");
	var output = document.getElementById("logDataOutput");
	var data = logData.value.trim();
	var line = data.split("\n");
	var jsonLine;
	var srcIpColor = "red";
	var destIpColor = "blue";
	var srcPortColor = "orange";
	var destPortColor = "teal";

	output.innerHTML = "";
	output.innerHTML = output.innerHTML + "new graph\n";

	for (var i = 0; i < line.length; i++){
		// Will need to refactor with regex to make dynamic.
		jsonLine = JSON.parse(line[i]);
		if(typeof jsonLine.src == 'undefined' ||
		   typeof jsonLine.src_port == 'undefined' ||
		   typeof jsonLine.dest == 'undefined' ||
		   typeof jsonLine.dest_port == 'undefined'){
			output.innerHTML = output.innerHTML + "One or more of src, src_port, dest, dest_port are undefined in: " + JSON.stringify(jsonLine) + "\n";
		} else {
			output.innerHTML = output.innerHTML + "add vertex ip" + jsonLine.src + " with attributes(color=" + srcIpColor + ")" + "\n";
			output.innerHTML = output.innerHTML + "add vertex ip" + jsonLine.dest + " with attributes(color=" + destIpColor + ")" + "\n";
			output.innerHTML = output.innerHTML + "add vertex " + jsonLine.src_port + " with attributes(color=" + srcPortColor + ")"+ "\n";
			output.innerHTML = output.innerHTML + "add vertex " + jsonLine.dest_port + " with attributes(color=" + destPortColor + ")"+ "\n";
		}
	}

	for (var i = 0; i < line.length; i++) {
		jsonLine = JSON.parse(line[i]);
		if(typeof jsonLine.src == 'undefined' ||
		   typeof jsonLine.src_port == 'undefined' ||
		   typeof jsonLine.dest == 'undefined' ||
		   typeof jsonLine.dest_port == 'undefined'){
			output.innerHTML = output.innerHTML + "One or more of src, src_port, dest, dest_port are undefined in: " + JSON.stringify(jsonLine) + "\n";
		} else {
			output.innerHTML = output.innerHTML + "add edge " + jsonLine.src_port + " - " + jsonLine.dest_port + "\n";
			output.innerHTML = output.innerHTML + "add edge ip" + jsonLine.src + " - ip" + jsonLine.dest + "\n";
			output.innerHTML = output.innerHTML + "add edge ip" + jsonLine.src + " - " + jsonLine.src_port + "\n";
			output.innerHTML = output.innerHTML + "add edge ip" + jsonLine.dest + " - " + jsonLine.dest_port + "\n";
		}
	}
}