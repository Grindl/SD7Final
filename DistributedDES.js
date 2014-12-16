var encryptedString = "ªUµ[+À;%Eú5 nÈhåk\\";
var plaintextString = "This is a test message";

var foundPass = false;
var currentPass = new Uint8Array(8);
for(var i = 0; i < 8; i++)
{
	currentPass[i] = 0;
}


var initThread = function(myWorker)
{
	var objOut = {};
	objOut.encryptedString = encryptedString;
	objOut.plaintextString = plaintextString;
	objOut.startPass = new Uint8Array(8);
	for(var i = 0; i < 8; i++){
		objOut.startPass[i] = currentPass[i];}
	currentPass[3]++;
	objOut.endPass = new Uint8Array(8);
	for(var i = 0; i < 8; i++){
		objOut.endPass[i] = currentPass[i];}
	myWorker.onmessage = onworkermessage;
	myWorker.postMessage(objOut);
}

var initRemoteWorker = function(remoteUser)
{
	var objOut = {};
	objOut.encryptedString = encryptedString;
	objOut.plaintextString = plaintextString;
	objOut.startPass = new Uint8Array(8);
	for(var i = 0; i < 8; i++){
		objOut.startPass[i] = currentPass[i];}
	currentPass[3]++;
	objOut.endPass = new Uint8Array(8);
	for(var i = 0; i < 8; i++){
		objOut.endPass[i] = currentPass[i];}
	remoteUser.send(objOut);
}

var onworkermessage = function(inObj)
{
	for(var i = 0; i < 8; i++){
		document.body.innerHTML += inObj.data.startPass[i] +" ";}
	document.body.innerHTML += "to ";
	for(var i = 0; i < 8; i++){
		document.body.innerHTML += inObj.data.endPass[i] +" ";}
	document.body.innerHTML += "took " + inObj.data.time+" milliseconds<br>";
	foundPass = foundPass || inObj.data.found;
	if (foundPass) 
	{
		if(inObj.data.found)
		{
			document.body.innerHTML += "<br>PASSWORD IS: ";
			for(var i = 0; i < 8; i++){
			document.body.innerHTML += inObj.data.password[i] +" ";}
			document.body.innerHTML +="<br><br>";
		}
	}
	else
	{
		if(currentPass[3] <= 128)
		{
			initThread(this);
		}
		else
		{
			document.body.innerHTML += "exhausted options <br>"
		}
	}

}

var onSlaveMessage = function(inObj)
{
	masterConnection.send(inObj.data);
}

var onRemoteWorkerMessage = function(inObj, remoteUser)
{
	var trueStartPass = new Uint8Array(inObj.startPass);
	var trueEndPass = new Uint8Array(inObj.endPass);
	for(var i = 0; i < 8; i++){
		document.body.innerHTML += trueStartPass[i] +" ";}
	document.body.innerHTML += "to ";
	for(var i = 0; i < 8; i++){
		document.body.innerHTML += trueEndPass[i] +" ";}
	document.body.innerHTML += "took " + inObj.time+" milliseconds<br>";
	foundPass = foundPass || inObj.found;
	if (foundPass) 
	{
		if(inObj.found)
		{
			document.body.innerHTML += "<br>PASSWORD IS: ";
			for(var i = 0; i < 8; i++){
			document.body.innerHTML += inObj.password[i] +" ";}
			document.body.innerHTML +="<br><br>";
		}
	}
	else
	{
		if(currentPass[3] <= 128)
		{
			initRemoteWorker(remoteUser);
		}
		else
		{
			document.body.innerHTML += "exhausted options <br>"
		}
	}

}

var spinUpThreads = function()
{
	for(var i = 0; i < 8; i++)
	{
		currentPass[i] = 0;
	}
	for(var i = 0; i < 7; i++)
	{
		var newWorker = new Worker("WebRTCFirstDraft.js");
		initThread(newWorker);
	}
}


//spinUpThreads();


var peer = new Peer({key: 'lwjd5qra8257b9'});

peer.on('open', function(id) {
  console.log('My peer ID is: ' + id);
  document.body.innerHTML += 'My peer ID is: ' + id;
});

var masterConnection;
var slaveConnection; //not sure if this needs to be stored outside; should probably be an array or map
var remoteID = "";

var connectToPeer = function()
{
	masterConnection = peer.connect(remoteID);
	var newWorker = new Worker("WebRTCFirstDraft.js");
	newWorker.onmessage = onSlaveMessage;
	


	masterConnection.on('open', function() {
		console.log("master connection initialized");
		masterConnection.on('data', function(data)
		{
			newWorker.postMessage(data);
		});

		masterConnection.on('error', function(err)
		{
			console.log(err);
		});
	});
}


peer.on('connection', function(conn) 
{
	slaveConnection = conn;
	

	slaveConnection.on('open', function() {
		console.log("slave connection initialized");
		initRemoteWorker(slaveConnection);
		slaveConnection.on('data', function(data)
		{
			onRemoteWorkerMessage(data, slaveConnection);
		});

		slaveConnection.on('error', function(err)
		{
			console.log(err);
		});
	});
});



