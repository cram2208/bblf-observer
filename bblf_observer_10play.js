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

  const logPort = 5005;
  const reloadDelay = 30 * 1000;
  const playbackCheckInterval = 0.1 * 1000;

  let videoElement;
  let reloadTimeout;
  let playbackCheckTimeout;
  let eventLoopActive = false;
  let eventLoopStopFlag = false;

  function eventLoop() {
    if (eventLoopActive) {
      warn("eventLoop: Event loop is already active.");
      return;
    }

    const eventLoopPollDelay = 0.1 * 1000;
    const reloadPageDelay = 30 * 1000;

    let lastVideoTime = null;
    let reloadPageTimeout;

    info("eventLoop: Replacing body with video...");
    document.body.replaceChildren(videoElement);

    (function _() {
      if (eventLoopStopFlag) {
        info("eventLoop._: Event loop has been stopped.");
        eventLoopActive = false;
        eventLoopStopFlag = false;
        return;
      }

      try {
        if (!videoElement) {
          info("eventLoop._: Waiting for video element...");
          return;
        }

        const currentVideoTime = videoElement.currentTime;

        if (lastVideoTime >= currentVideoTime) {
          if (!reloadPageTimeout) {
            info("eventLoop._: Video playback has stalled. Page will reload in " + reloadPageDelay + "ms...");
            reloadPageTimeout = setTimeout(() => {
              info("eventLoop._: Reload page timeout reached.");
              window.location.href = "https://10.com.au/big-brother"
              eventLoopStopFlag = true;
            }, reloadPageDelay);
          }
        } else if (reloadPageTimeout) {
          info("eventLoop._: Video playback has resumed. Page reload timeout has been cancelled.");
          clearTimeout(reloadPageTimeout);
          reloadPageTimeout = null;
        }

        lastVideoTime = currentVideoTime;
      } finally {
        setTimeout(_, eventLoopPollDelay);
      }
    })();

    info("eventLoop: Event loop is now active.");
    eventLoopActive = true;
  }

  function videoObserver(_, obs) {
    videoElement = document.querySelector("video");

    if (videoElement) {
      const interval = setInterval(() => {
        videoElement = document.querySelector("video");
        if (videoElement.paused) {
          info("videoObserver: Waiting for video to play...");
        } else {
          info("videoObserver: Calling Event Loop...");
          eventLoop();
          clearInterval(interval);
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
