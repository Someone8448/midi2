const { isMainThread, parentPort } = require("worker_threads");
if (isMainThread) {
    console.error("You are running the wrong file; run index.js!");
    process.exit();
}
var config = require('./config.json');
var client = {sendArray: () => {}, startNote: () => {}, stopNote: () => {}};
var loaded = false;
parentPort.on('message', msg => {
	//console.log(msg)
	if (msg.m === "connect") {
		if (loaded) return;
		client = new (require(config.client))(config.uri, msg.token);
		client.setChannel(config.channel);
		client.start();
		client.on('hi', m => parentPort.postMessage(m));
		client.on('a', m => parentPort.postMessage(m));
		client.once('ch', m => parentPort.postMessage({m: "connected"}))
		loaded = true
	} else if (msg.m === "userset") {
		client.sendArray([{m: "userset", set: {name: msg.name, color: msg.color}}]);
	} else if (msg.m === "say") {
		client.sendArray([{m: "a", message: msg.a}])
	} else if (msg.m === "start") {
		client.startNote(msg.n, msg.v);
	} else if (msg.m === "stop") {
		client.stopNote(msg.n)
	} else if (msg.m === "note") {
		msg.n.forEach(m => setTimeout(() => {
			if (m.m === "start") return client.startNote(m.n, m.v);
			return client.stopNote(m.n)
		}, m.delay));
	} else if (msg.m === "data") {
		client.sendArray(msg.a);
	} else if (msg.m === "mouse") client.sendArray([{m: "m", x: msg.x, y: msg.y}]);
})
parentPort.postMessage({m: 'ready'})
