# midi2
Sort-of multithreaded Node.JS MPP MIDI Player
## Setting Up
To set up this player, you will need to edit config.json. Here's a list of all the properties that can be used within it.
```javascript
{
        "uri": "wss://mppclone.com", //this can be a URI to any MPP server.
        "tokens": ["token 1", "token 2"], //this can be defined as an array like it currently is for the tokens, or a number to specify the amount of clients if tokens aren't supported
        "maxDownload": 100, //this is the highest in megabytes of a midi you can download to it
        "path": "../../Downloads/", //this is the path that midi files will be saved to and midis will load from
        "channel": "midi", //this is the channel the bot(s) will connect to
        "buffer": 2000, //this is the timeout between each message it sends
        "length": 512, //this is the max length of a message sent, will continue to another message
        "list": 5, //how many midis list and find command show at a time
        "nq": 1200000, //hard set notequota
        "player": "midi-player-js", //the module for midi-player-js
        "client": "mpp-client-net", //the module for the mpp client
        "name": "[midi 2]", //the bot's names
        "color": "#ff0000", //the bot's color
        "prefix": "midi", //the bot's prefix
        "playerbuffer": 0, //how often it will send messages from the player for note data
        "notebuffer": 0, //how often it will send note data to the clients
        "userkey": true, //if each user only plays to one part of the piano, setting to false makes it loop through clients
        "deblack": false, //when false, it deblacks if vel is less than 54, but true makes it automatic based on nq
        "cpu": 1000, //define it as a number to start measuring cpu, the number is the interval in which it updates
        "info": 50, //how often the player stats used in some animations and data updates
        "cursor": { //you can remove this entire property to disable cursor
                "mode": "circle", //can be circle, spin, or piano
                "interval": 50, //the interval the cursor updates at
                "timeout": 0 //the time between sending the cursor position after calculating
        },
        "rainbow": { //you can remove this entire property to disable cursor
                "data": ["#FF0000","#FF1100","#FF2300","#FF3400","#FF4600","#FF5700","#FF6800","#FF7A00","#FF8B00","#FF9C00","#FFAE00","#FFBF00","#FFD100","#FFE200","#FFF300","#F9FF00","#E8FF00","#D6FF00","#C5FF00","#B4FF00","#A2FF00","#91FF00","#80FF00","#6EFF00","#5DFF00","#4BFF00","#3AFF00","#29FF00","#17FF00","#06FF00","#00FF0C","#00FF1D","#00FF2E","#00FF40","#00FF51","#00FF63","#00FF74","#00FF85","#00FF97","#00FFA8","#00FFB9","#00FFCB","#00FFDC","#00FFEE","#00FFFF","#00EEFF","#00DCFF","#00CBFF","#00B9FF","#00A8FF","#0097FF","#0085FF","#0074FF","#0063FF","#0051FF","#0040FF","#002EFF","#001DFF","#000CFF","#0600FF","#1700FF","#2900FF","#3A00FF","#4B00FF","#5D00FF","#6E00FF","#7F00FF","#9100FF","#A200FF","#B400FF","#C500FF","#D600FF","#E800FF","#F900FF","#FF00F3","#FF00E2","#FF00D1","#FF00BF","#FF00AE","#FF009C","#FF008B","#FF007A","#FF0068","#FF0057","#FF0046","#FF0034","#FF0023","#FF0011"], //hard set list of colors to loop thru
                "mode": "both", //user to set each users color to a different color when connected, both to loop through a list continuously, interval, to have all bots loop through the list at the same color
                "interval": 125 //the interval in which it updates the name
        },
        "stats": { //optional, this allows stats in name
                "data": "`[midi 2]${info.playing ? (' | ' + ((info.tick / info.total) * 100).toFixed(2) + '% | ' +  ((nq.points / nq.max) * 100).toFixed(2) + '% NQ') : ' | Idle'}`", //code to eval as name
                "interval": 200 //how fast it updates
        },
        "allowed": ["23db11eea4407d4669952c77"] //only define this property if you want only the users in the array to be able to use the bot
}
```
## Running
You can run it with: 
```
node .
```
or if you want to increase the amount of allocated memory (in MB)
```
node --max-old-space-size=8192 .
```
## Required Packages
the required packages to install are mpp-client-net, midi-player-js, axios, node-downloader-helper
you can run `npm i mpp-client-net midi-player-js axios node-downloader-helper` to install all of these.
