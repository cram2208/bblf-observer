// ==UserScript==
// @name        BBAU Live Feeds
// @namespace   Violentmonkey Scripts
// @match       https://10.com.au/live/big-brother-live-stream
// @grant       none
// @run-at      document-body
// @version     1.0
// @author      -
// @description 09/11/2025, 12:35:32
// ==/UserScript==

(function() {
  "use strict";

  let logPort = 5005;
  let videoElement;
  let reloadTimeout;
  let reloadDelay = 30 * 1000;
  let playbackCheckTimeout;
  let playbackCheckInterval = 0.1 * 1000;

  function replaceBodyWithVideo() {
    document.body.replaceChildren(videoElement);
    videoElement.addEventListener("waiting", (e) => {
      log("WAITING DETECTED");
      log("WAITING EVENT", e);

      if (!reloadTimeout) {
        reloadTimeout = setTimeout(() => {
          info("RELOADING LIVE FEEDS...");
          window.location.href = "https://10.com.au/big-brother";
        }, reloadDelay);
        info("reloadTimeout HAS STARTED!", reloadTimeout);
      }

      if (!playbackCheckTimeout) {
        let lastVideoTime = videoElement.currentTime;
        playbackCheckTimeout = setInterval(() => {
          const currentTime = videoElement.currentTime;
          if (lastVideoTime != currentTime) {
            log("PLAYBACK RESUMED");
            clearTimeout(reloadTimeout);
            reloadTimeout = null;
            clearInterval(playbackCheckTimeout);
            playbackCheckTimeout = null;
          } else {
            log("PLAYBACK STILL WAITING");
          }
        }, playbackCheckInterval);
      }
    });
  }

  function videoObserver(_, obs) {
    videoElement = document.querySelector("video");

    if (videoElement) {
      const timeout = setInterval(() => {
        videoElement = document.querySelector("video");
        if (videoElement.paused) {
          log("STILL PAUSED");
        } else {
          clearInterval(timeout);
          replaceBodyWithVideo();
          log("replaceBodyWithVideo WAS CALLED!");
        }
      }, 500);

      obs.disconnect();
    }
  }

  const mo = new MutationObserver(videoObserver);
  mo.observe(document.body, {childList: true, subtree: true});

  async function logToServer(level, ...msg) {
    console.log("TNT: [" + level + "]", msg);

    try {
      const json_response = await fetch("http://localhost:" + logPort + "/log", {
        method: "POST",
        body: JSON.stringify({
          level: level,
          timestamp: Date.now(),
          message: msg,
          userAgent: navigator.userAgent
        }),
      }).then(response => response.json());

      console.log("Server response:", json_response);
    } catch (error) {
      console.error("Error sending log:", error);
    }
  }

  async function log(...msg) { await logToServer("LOG", "BBLF Observer:", ...msg); }
  async function warn(...msg) { await logToServer("WARN", "BBLF Observer:", ...msg); }
  async function error(...msg) { await logToServer("ERROR", "BBLF Observer:", ...msg); }
  async function info(...msg) { await logToServer("INFO", "BBLF Observer:", ...msg); }

  window.bblf = { logToServer };
})();
