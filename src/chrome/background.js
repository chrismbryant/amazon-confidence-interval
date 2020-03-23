/*global chrome*/

/**
 *  This listener executes a callback when the tab reloads or changes url
 *   If the new url is the amazon search page, set the active icon and execute inject.js
 *   Else, set the inactive icon
 *
 */

chrome.tabs.onUpdated.addListener((tabId, change) => {
  if (change.status == "complete") {
    chrome.tabs.get(tabId, tab => {
      if (/amazon\..*\/s\?/.exec(tab.url)) {
        chrome.tabs.executeScript(tabId, { file: "chrome/inject.js" });

        // chrome.pageAction.setIcon({
        //   tabId,
        //   path: "/images/icon_active.png"
        // });
      } else {
        // chrome.pageAction.setIcon({
        //   tabId,
        //   path: "/images/icon_inactive.png"
        // });
      }
    });
  }
});
