const config = require('./config.json');
const { Worker } = require("worker_threads");
const fs = require('fs')
if (config.tokens.length) {
var tokens = config.tokens
} else if (typeof config.tokens === "number") {
var tokens = []
for (var i = 0; i < config.tokens; i++) tokens.push("")
} else throw new Error('Invalid Tokens');
//console.log(tokens)
//createPlayer()
if (config.rainbow) {
var color = {count: 0}
color.color = () => {
color.count++;
if (color.count >= config.rainbow.data.length) color.count = 0;
return config.rainbow.data[color.count]
}
}
var client = {count: 0, clients: []};
tokens.forEach((c, i) => {
	var cl = new Worker('./client.js');
	if (config.notebuffer) {
		cl.buffer = {data: [], time: Date.now()};
		cl.note = (m) => {
				m.delay = Date.now() - cl.buffer.time
				if (m.delay >= config.notebuffer) m.delay = config.notebuffer;
				cl.buffer.data.push(m)
			}
	} else cl.note = m => cl.postMessage(m);
	if (config.cursor && config.cursor.timeout) {
		cl.mouse = (x, y) => setTimeout(() => cl.postMessage({m: "mouse", x: x, y: y}), config.cursor.timeout)
	} else cl.mouse = (x, y) => cl.postMessage({m: "mouse", x: x, y: y})
	if (config.rainbow && config.rainbow.mode === "user") cl.color = color.color();
	cl.connected = false;
	cl.on('message', msg => {
		//console.log(msg)
		if (msg.m === "ready") cl.postMessage({m: "connect", token: c})
		if (msg.m === "hi") cl.postMessage({m: "userset", name: config.name, color: config.rainbow && config.rainbow.mode === "user" ? cl.color : config.color});
		if (msg.m === "connected") {cl.x = Math.random() * 100; cl.y = Math.random() * 100}
	})
	if (i == 0) client.base = cl;
	client.clients.push(cl);
});
if (config.notebuffer) setInterval(() => client.clients.forEach(c => {
	c.buffer.time = Date.now();
	if (c.buffer.data.length == 0) return;
	c.postMessage({m: "note", n: c.buffer.data});
	delete c.buffer.data;
	c.buffer.data = []
}),config.notebuffer)
client.client = (u) => {
	if (typeof u === "number") return client.clients[u]
	client.count++;
	if (client.count >= client.clients.length) client.count = 0;
	return client.clients[client.count]
}

var speak = {}
speak.msgs = []
speak.say = function (ms) {
   // if (speak.interval) return msg.match(/.{0,511}/g).forEach(function(x, i) { if (x == "") return; if (i !== 0) x = "" + x; speak.msgs.push({m: "a", a: x})})
    eval(`ms.match(/.{0,${config.length}}/g)`).forEach(function(x, i) { if (x == "") return; if (i !== 0) x = "" + x; speak.msgs.push({m: "say", a: x})})
    if (speak.interval) return;
    client.base.postMessage(speak.msgs[0])
    speak.msgs.splice(0,1)
    speak.interval = setInterval(() => {
        if (speak.msgs.length == 0) { clearInterval(speak.interval); delete speak.interval; return;}
	client.base.postMessage(speak.msgs[0])
        speak.msgs.splice(0,1)

    }, config.buffer)
}

var nq = require('./quota.js')(config.nq , 6000)
var player = {};
var keys = ["a-1","as-1","b-1","c0","cs0","d0","ds0","e0","f0","fs0","g0","gs0","a0","as0","b0","c1","cs1","d1","ds1","e1","f1","fs1","g1","gs1","a1","as1","b1","c2","cs2","d2","ds2","e2","f2","fs2","g2","gs2","a2","as2","b2","c3","cs3","d3","ds3","e3","f3","fs3","g3","gs3","a3","as3","b3","c4","cs4","d4","ds4","e4","f4","fs4","g4","gs4","a4","as4","b4","c5","cs5","d5","ds5","e5","f5","fs5","g5","gs5","a5","as5","b5","c6","cs6","d6","ds6","e6","f6","fs6","g6","gs6","a6","as6","b6","c7"];
var nps = 0;
var presses = {};
keys.forEach(k => {presses[k] = false});
if (config.cursor && config.cursor.mode === "piano") {
var press = [];
for (var i = 0; i < client.clients.length; i++) press.push(false);
}
var sustain = false;
var deblack = false;
var loading = 0;
if (config.info) {
var info = {m: "info", playing: false, tick: 1, total: 2, tempo: 120, time: 5};
setInterval(() => player.postMessage({m: "info"}), config.info)
}
function createPlayer () {
player = new Worker('./player.js');
player.on('message', m => {
	if (m.m !== "info") return;
	info = m
})
player.on('message', m => {
	if (m.m !== "midi") return;
	if (m.a.length) {
		m.a.forEach(msg => setTimeout(() => {
			if (!nq.try()) return;
			if (!msg.name.startsWith('Note')) return;
			var key = keys[msg.noteNumber - 21];
			var vel = msg.velocity / 127;
			if (!key) return;
			if (msg.name === "Note on") {
				if (deblack && msg.velocity < 54) return;
				client.client(config.userkey ? Math.floor((keys.indexOf(key)) / (keys.length / client.clients.length)) : undefined).note({m: "start", n: key, v: vel});
				presses[key] = true;
				nps++;
				if (config.cursor && config.cursor.mode === "piano") press[Math.floor((keys.indexOf(key)) / (keys.length / client.clients.length))] = true
			} else {
				if (sustain || !presses[key]) return;
				client.client(config.userkey ? Math.floor((keys.indexOf(key)) / (keys.length / client.clients.length)) : undefined).note({m: "stop", n: key});
				presses[key] = false;
			}
			nq.spend(1)
		}, msg.delay));
		return;
	}
	var msg = m
	if (!nq.try()) return;
	if (!msg.a.name.startsWith('Note')) return;
	var key = keys[msg.a.noteNumber - 21];
	var vel = msg.a.velocity / 127;
	if (!key) return;
	if (msg.a.name === "Note on") {
		if (deblack && msg.a.velocity < 54) return;
		client.client(config.userkey ? Math.floor((keys.indexOf(key)) / (keys.length / client.clients.length)) : undefined).note({m: "start", n: key, v: vel});
		presses[key] = true;
		nps++;
		if (config.cursor && config.cursor.mode === "piano") press[Math.floor((keys.indexOf(key)) / (keys.length / client.clients.length))] = true
	} else {
		if (sustain || !presses[key]) return;
		client.client(config.userkey ? Math.floor((keys.indexOf(key)) / (keys.length / client.clients.length)) : undefined).note({m: "stop", n: key});
		presses[key] = false
	}
	nq.spend(1)
});
player.on('message', msg => {
if (msg.m !== "load") return;
	loading = 0
	speak.say(`Loaded in ${msg.t.toFixed(2)}ms`)
})
player.on('message', msg => {
if (msg.m !== "loading") return;
        loading = msg.a;
})
player.on('exit', createPlayer);
player.on('error', createPlayer);
loading = 0
}
createPlayer()
var info = () => {
return new Promise(r => {player.postMessage({m: "info"}); player.on('message', m => {if (m.m === "info") r(m)})})
}
client.base.on('message', async msg => {
if (msg.m !== "a") return;
    try {
        if (config.allowed && !config.allowed.includes(msg.p._id)) return;
        var cmd = msg.a.trim().split(' ')[0].toLowerCase()
        var args = msg.a.trim().substr(cmd.length).replace(/\s+/g, ' ').trim().split(' ')
        if (cmd !== config.prefix) return;
if (args[0] === "download") {
    if (!args[1]) return speak.say(`Usage: ${config.prefix} download <MIDI URL>`)
    if (!(new URL(args[1])).pathname.endsWith('.mid')) return speak.say('Incorrect file type.')
    var downloader = new (require('node-downloader-helper').DownloaderHelper)(args[1], config.path);
    var fileSize = await (require('axios').head)(args[1])
    var fileSize = parseInt(fileSize.headers['content-length'])
    
      if (fileSize <= config.maxDownload * 1024 * 1024) {
        downloader.on('end', file => {speak.say(`Downloaded as ${file.fileName}`)})
        downloader.on('error', () => {speak.say('Error.')})
        await downloader.start();
      } else {
        speak.say(`Reached limit of ${config.maxDownload}MB file!`);
      }
    } else if (args[0] === "load") {
    try {
    if (args.length == 1) return speak.say(`Usage: ${config.prefix} load <full file name>`)
    if (!fs.readdirSync(config.path).includes(args.slice(1).join(' '))) return speak.say('This file is not found, make sure you are using its full name.')
    player.postMessage({m: "stop"})
    player.postMessage({m: "load", a:`${config.path}${args.slice(1).join(' ')}`, id: 0})
    } catch (error) {
        console.log(error)
    return speak.say(`Loading failed.`)
    }
    } else if (args[0] === "stop") {
    player.postMessage({m: "stop"})
    speak.say('Stopped.')
    } else if (args[0] === "list") {
    var num = Number(args[1])
    var num = isNaN(num) ? 0 : num
    var dir = fs.readdirSync(config.path).filter(a => a.endsWith('.mid'))
    var list = []
    for (var i =num; i < num+config.list; i++) {
    if (!dir[i]) {
    list.push('End of list.')
    break;
    }
    list.push(`\`\`\`${dir[i]}\`\`\``)
    }
    speak.say(list.join(' | ') + ((num == 0) ? ` | Usage: ${config.prefix} list <number> | Shows ${config.list} at a time.` : ""))
    } else if (args[0] === "find") {
        if (args.length == 1) return speak.say(`Usage: ${config.prefix} find <Optional Number> <data>`)
        var dir = fs.readdirSync(config.path).filter(a => a.endsWith('.mid'))
        var num = isNaN(Number(args[1])) ? 0 : Number(args[1])
        var item = isNaN(Number(args[1])) ? args.slice(1).join(' ') : args.slice(2).join(' ')
        var items = dir.filter(file => file.toLowerCase().includes(item.toLowerCase()))
        speak.say(`\`Index: ${num}\` | ${items.slice(num, num+config.list).map(a => "```" + a + "```").join(' -|- ')} | \`${items.length} total items, showing ${config.list}.\``)
    } else if (args[0] === "play") {
        player.postMessage({m: "play"});
	speak.say('Now Playing.')
    } else if (args[0] === "pause") {
        player.postMessage({m: "pause"})
        speak.say('Paused the MIDI.')
    } else if (args[0] === "deblack") {
        deblack = !deblack
        speak.say(`Deblacking is now ${deblack}`)
    } else if (args[0] === "sustain") {
        sustain = !sustain
        speak.say(`Sustain is now ${sustain}`)
    } else if (args[0] === "about") {
	speak.say(`Multithreaded MIDI Player made in Node.js by Someone8448 | ${client.clients.length} clients` + (config.cursor ? ` | Cursor anim set to ${config.cursor.mode}` : ""))
    } else if (args[0] === "help") speak.say(`Usage: ${config.prefix} <play, download, stop, list, find, load, pause, deblack, sustain, about> <options>`)
} catch (error) {
    return speak.say(`Error: ${error}`)
}
})
if (config.cursor !== undefined) {
if (config.cursor.mode === "piano") {
        var cursor = async () => {
			//var p = await info()
                        //if (!p.playing) return client.clients.forEach(c => c.postMessage({m: "mouse", x: 200, y: 200}));
                        var diff = (100 / client.clients.length);
                        //console.log(press)
                        for (var int = 0; int < client.clients.length; int++) {
                                var num = diff * int;
                                var x = num + (diff * 0.5);
                                var y = press[int] ? 10 : 15;
                                press[int] = false;
				if (x !== client.clients[int].x || y !== client.clients[int].y) {
				client.clients[int].x = x;
				client.clients[int].y = y;
				client.clients[int].mouse(x, y)
				//client.clients[int].postMessage({m: "mouse", x: x, y: y})
				}
                        }
        }
} else if (config.cursor.mode === "spin") {
	var cursor = () => {
		if (!info.playing) nps = 0;
		for (var int = 0; int < client.clients.length; int++) {
			if (info.playing) {
				var num = (10 / client.clients.length) * int;
				var x = ((( (info.tick) / info.total) * 80) + 10 ) + Math.sin((nps) / (Math.PI * -150)) * num * 0.5625;
				var y = 50 + Math.cos((nps) / (Math.PI * -150)) * num;
			} else {
				var x = 200;
				var y = 200;
			}
			if (x !== client.clients[int].x || y !== client.clients[int].y) {
				client.clients[int].x = x;
				client.clients[int].y = y;
				client.clients[int].mouse(x, y);
			}
		}
		if (info.playing) nps += 100 / (1000 / config.cursor.interval)
	}
} else if (config.cursor.mode === "circle") {
	var cursor = () => {
		if (!info.playing) nps = 0;
		for (var int = 0; int < client.clients.length; int++) {
			if (info.playing) {
				var num = int * ((3 * 1000) / client.clients.length);
				var x = ((( (info.tick) / info.total) * 80) + 10 ) + Math.sin((nps + num) / (Math.PI * -150)) * 10 * 0.5625;
				var y = 50 + Math.cos((nps + num) / (Math.PI * -150)) * 10;
			} else {
				var x = 200;
				var y = 200;
			}
			if (x !== client.clients[int].x || y !== client.clients[int].y) {
				client.clients[int].x = x;
				client.clients[int].y = y;
				client.clients[int].mouse(x, y)
			}
		}
		if (info.playing) nps += 100 / (1000 / config.cursor.interval)
	}
} else throw new Error('Invalid Animation!');
    setInterval(cursor, config.cursor.interval)
}
if (config.rainbow) {
	if (config.rainbow.mode === "interval") {
		var rainbowfun = () => {
			var rcolor = color.color();
			client.clients.forEach(c => c.postMessage({m: "userset", color: rcolor}));
		}
	} else if (config.rainbow.mode === "both") {
		var rainbowfun = () => {
			var rnum = Number(color.count);
			rnum++;
			if (rnum >= config.rainbow.data.length) rnum = 0;
			client.clients.forEach(c => c.postMessage({m: "userset", color: color.color()}));
			color.count = rnum
		}
	} else if (config.rainbow.mode === "user") {
		var rainbowfun = () => {}
	} else throw new Error('Invalid Rainbow Mode!');
	if (config.rainbow.mode !== "user") setInterval(rainbowfun, config.rainbow.interval)
}
if (config.stats) {
        setInterval(() => {
                client.base.postMessage({m: "userset", name: eval(config.stats.data)})
        }, config.stats.interval)
}

if (config.cpu) { 
function secNSec2ms (secNSec) {
  if (Array.isArray(secNSec)) { 
    return secNSec[0] * 1000 + secNSec[1] / 1000000; 
  }
  return secNSec / 1000; 
}
 
var startTime = process.hrtime();
var startUsage = process.cpuUsage();
var cpuUsage = 0;

setInterval(() => {
        var elapTime = process.hrtime(startTime)
        var elapUsage = process.cpuUsage(startUsage)
        var elapTimeMS = secNSec2ms(elapTime)
        var elapUserMS = secNSec2ms(elapUsage.user)
        var elapSystMS = secNSec2ms(elapUsage.system)
        var cpuPercent = Math.round(100 * (elapUserMS + elapSystMS) / elapTimeMS)
        //console.log(cpuPercent);
        cpuUsage = cpuPercent;
        startTime = process.hrtime();
        startUsage = process.cpuUsage()
}, config.cpu)
}
