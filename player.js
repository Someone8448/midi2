const { isMainThread, parentPort } = require("worker_threads");
if (isMainThread) {
    console.error("You are running the wrong file; run index.js!");
    process.exit();
}
var config = require('./config.json');
if (config.playerbuffer) {
var buffer = {data: [], time: Date.now()};
setInterval(() => {
	buffer.time = Date.now();
	if (buffer.data.length == 0) return;
	//console.log(buffer.data.length)
	parentPort.postMessage({m: "midi", a: buffer.data});
	delete buffer.data
	buffer.data = []
}, config.playerbuffer)
} 
var player = new (require(config.player).Player)(evt => {
	if (!evt.name.startsWith('Note')) return
	setTimeout(() => player.playLoop.bind(player), 0)
	if (config.playerbuffer) {
		var mevt = evt;
		mevt.delay = Date.now() - buffer.time;
		if (mevt.delay >= config.playerbuffer) mevt.delay = config.playerbuffer
		buffer.data.push(mevt);
		return;
	}
	parentPort.postMessage({m: "midi", a: evt})
});
parentPort.on('message', msg => {
	if (msg.m === "load") {
		var start = performance.now();
		player.loadFile(msg.a);
		var end = performance.now();
		parentPort.postMessage({m: "load", id: msg.id, t: end - start});
	} else if (msg.m === "stop") {
		player.stop();
		parentPort.postMessage({m: "stop"});
	} else if (msg.m === "play") {
		player.play();
		parentPort.postMessage({m: "play"});
	} else if (msg.m === "pause") {
		player.pause();
		parentPort.postMessage({m: "pause"})
	} else if (msg.m === "info") {
		parentPort.postMessage({m: "info", playing: player.isPlaying(), tick: player.tick, total: player.totalTicks, tempo: player.tempo, time: player.getSongTime()})
	}
})
