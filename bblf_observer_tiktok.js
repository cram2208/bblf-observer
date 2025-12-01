// ==UserScript==
// @name        BBAU Tik Tok
// @namespace   Violentmonkey Scripts
// @match       https://www.tiktok.com/@bigbrotherau/live
// @grant       none
// @run-at      document-body
// @version     1.0
// @author      -
// @description 09/11/2025, 12:35:32
// ==/UserScript==

(function() {
  "use strict";

  const reloadDelay = 30 * 1000;
  const playbackCheckInterval = 0.1 * 1000;
  const noVideoReloadDelay = 60 * 1000;

  let videoElement;
  let reloadTimeout;
  let playbackCheckTimeout;
  let eventLoopActive = false;
  let eventLoopStopFlag = false;
  let noVideoReloadTimeout;

  function eventLoop() {
    if (eventLoopActive) {
      warn("eventLoop: Event loop is already active.");
      return;
    }

    const eventLoopPollDelay = 0.1 * 1000;
    const reloadPageDelay = 5 * 1000;

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
              window.location.href = "https://www.tiktok.com/@bigbrotherau/live"
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
      info("videoObserver: Video detected. Clearing noVideoReloadTimeout timeout...");
      clearTimeout(noVideoReloadTimeout);
      noVideoReloadTimeout = null;

      const interval = setInterval(() => {
        videoElement = document.querySelector("video");
        if (videoElement.paused) {
          info("videoObserver: Waiting for video to play...");
        } else {
          info("videoObserver: Calling Event Loop...");
          videoElement.muted = false;
          eventLoop();
          clearInterval(interval);
        }
      }, 500);

      obs.disconnect();
    } else if (!noVideoReloadTimeout) {
      info("videoObserver: No video detected. Starting "+noVideoReloadDelay+"ms timeout...");
      noVideoReloadTimeout = setTimeout(() => {
        info("videoObserver: noVideoReloadTimeout expired. Reloading...");
        document.location.reload();
      }, noVideoReloadDelay);
    }
  }

  const mo = new MutationObserver(videoObserver);
  mo.observe(document.body, {childList: true, subtree: true});

  function log(...msg) { console.log("TNT: [LOG] BBLF Observer:", ...msg); }
  function warn(...msg) { console.log("TNT: [WARN] BBLF Observer:", ...msg); }
  function error(...msg) { console.log("TNT: [ERROR] BBLF Observer:", ...msg); }
  function info(...msg) { console.log("TNT: [INFO] BBLF Observer:", ...msg); }
})();
