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
  let lastVideoTime;

  function replaceBodyWithVideo() {
    document.body.replaceChildren(videoElement);
    videoElement.addEventListener("waiting", (event) => {
      log("WAITING DETECTED");
      log("WAITING EVENT", event);
      clearTimeout(reloadTimeout);
      reloadTimeout = setTimeout(() => window.location.reload(), reloadDelay);
      lastVideoTime = videoElement.currentTime;
      let stopFlag = false;
      playbackCheckTimeout = setInterval(() => {
        const currentTime = videoElement.currentTime;
        if (lastVideoTime != currentTime) {
          log("PLAYBACK RESUMED");
          clearInterval(playbackCheckTimeout);
          clearTimeout(reloadTimeout);
        } else {
          log("PLAYBACK STILL WAITING");
        }
      }, playbackCheckInterval);
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

  async function logToServer(msg, level) {
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

  async function log(msg) { await logToServer("BBLF Observer: " + msg, "LOG"); }
  async function warn(msg) { await logToServer("BBLF Observer: " + msg, "WARN"); }
  async function error(msg) { await logToServer("BBLF Observer: " + msg, "ERROR"); }
  async function info(msg) { await logToServer("BBLF Observer: " + msg, "INFO"); }

  window.bblf = { logToServer };
})();
