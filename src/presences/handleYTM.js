const Entities = require("html-entities").AllHtmlEntities;
const entities = new Entities();
const { ytm_client_id } = require("../config.json");
const Config = require('electron-config');
const userSettings = new Config({
  name: 'userSettings'
})
let constants = require('../util/constants.js')
let lastEndTime = 0

constants.ytmrpc.login({clientId: ytm_client_id})
.catch(err => {
  var retryRPCLogin = setInterval(() => {
    constants.ytmrpc.login({ clientId: ytm_client_id })
    clearInterval(retryRPCLogin)
  }, 10 * 1000)
});

constants.ytmrpc.on("ready", () => YTMRPCREADY = true)
constants.ytmrpc.on("disconnected", () => console.log("OH NOES!"))
constants.ytmrpc.on("errored", () => console.log("OH NOES!"))

module.exports = (data, force) => {
  if (force) {
    if (data.ytm.playback == "paused") {
      constants.menuBar.tray.setTitle("");
      if(YTMRPCREADY) constants.ytmrpc.setActivity({
        details: entities.decode(CURRENTSONGTITLE),
        state: entities.decode(CURRENTSONGAUTHORSSTRING),
        largeImageKey: "ytm_lg",
        largeImageText: "YT Presence " + VERSIONSTRING,
        smallImageKey: "pause",
        smallImageText: "Playback paused",
        instance: true
      })
    } else if (data.ytm.playback == "playing") {
      if(userSettings.get('titleMenubar'))
      constants.menuBar.tray.setTitle(CURRENTSONGTITLE);
      if(YTMRPCREADY) constants.ytmrpc.setActivity({
        details: entities.decode(CURRENTSONGTITLE),
        state: entities.decode(CURRENTSONGAUTHORSSTRING),
        largeImageKey: "ytm_lg",
        largeImageText: "YT Presence " + VERSIONSTRING,
        smallImageKey: "play",
        smallImageText: "Playing back.",
        startTimestamp: CURRENTSONGSTARTTIME,
        endTimestamp: CURRENTSONGENDTIME,
        instance: true
      })
    }
  } else {
    CURRENTSONGTITLE = data.ytm.songTitle
    CURRENTSONGAUTHORS = data.ytm.songAuthors
    CURRENTSONGSTARTTIME = Math.floor(data.ytm.songCurrentTime / 1000);
    CURRENTSONGENDTIME = data.ytm.songEndTime;
    //* Create author string from author array
    CURRENTSONGAUTHORS.forEach((author, index, authors) => {
      if (index == 0)
      CURRENTSONGAUTHORSSTRING = author;
      else if (index < authors.length - 2)
      CURRENTSONGAUTHORSSTRING = CURRENTSONGAUTHORSSTRING + ", " + author;
      else if (index < authors.length - 1) CURRENTSONGAUTHORSSTRING = CURRENTSONGAUTHORSSTRING + " and " + author;
      else CURRENTSONGAUTHORSSTRING = CURRENTSONGAUTHORSSTRING + " &bull; " + author;
    });

    if (data.ytm.playback == "playing" && CURRENTSONGENDTIME != lastEndTime && YTMRPCREADY) {
      lastEndTime = CURRENTSONGENDTIME
      if(userSettings.get('titleMenubar'))
      constants.menuBar.tray.setTitle(CURRENTSONGTITLE);
      constants.ytmrpc.setActivity({
        details: entities.decode(CURRENTSONGTITLE),
        state: entities.decode(CURRENTSONGAUTHORSSTRING),
        largeImageKey: "ytm_lg",
        largeImageText: "YT Presence " + VERSIONSTRING,
        smallImageKey: "play",
        smallImageText: "Playing back.",
        startTimestamp: CURRENTSONGSTARTTIME,
        endTimestamp: CURRENTSONGENDTIME,
        instance: true
      })
    }
  }
}