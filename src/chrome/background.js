/*global chrome*/

const tabStore = {};

/**
 *  This function takes a tabId and verifies if the tab url is the amazon search page
 *    If it is, it sets the active icon and runs content.js
 *    If not, set the inactive icon
 *
 *
 * @param {*} tabId
 */
function updateTab(tabId) {
  chrome.tabs.get(tabId, tab => {
    if (/amazon\..*\/s\?/.exec(tab.url)) {
      chrome.tabs.executeScript(tabId, { file: "content.js" });

      chrome.pageAction.setIcon({
        tabId,
        path: "/images/icon_active.png"
      });
    } else {
      chrome.pageAction.setIcon({
        tabId,
        path: "/images/icon_inactive.png"
      });
    }
  });
}

chrome.tabs.onActivated.addListener(activeInfo => {
  updateTab(activeInfo.tabId);
});

chrome.tabs.onUpdated.addListener((tabId, change) => {
  if (change.url) {
    updateTab(tabId);
  }
});
