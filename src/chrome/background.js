/**
 *  This listener executes a callback when the tab reloads or changes url
 *   If the new url is the amazon search page, set the active icon and execute inject.js
 *   Else, set the inactive icon
 *
 */

/** Amazon domains whose search pages we are allowed to inject into. */
const ALLOWED_HOSTS = ["amazon.com", "amazon.ca"];

/**
 * Decide whether a URL is an Amazon search results page.
 *
 * This is deliberately strict: the URL is parsed rather than pattern-matched so
 * that an attacker cannot craft a page whose URL merely *contains* something
 * that looks like an Amazon search URL (e.g.
 * "https://evil.example/?ref=amazon.com/s?q=") and trick us into running our
 * content script — and therefore its page-level privileges — in their origin.
 *
 * @param {string|undefined} url  URL of the tab that just finished loading
 * @returns {boolean}
 */
function isAmazonSearchPage(url) {
    let parsed;
    try {
        parsed = new URL(url);
    } catch (e) {
        return false; // not a parseable URL (e.g. "about:blank")
    }
    // Require TLS: over plain http the page (and our injected script) is
    // trivially tampered with in transit.
    if (parsed.protocol !== "https:") return false;
    // Exact host or a subdomain of it — never a suffix match like
    // "notamazon.com" or a lookalike like "amazon.com.evil.example".
    const host = parsed.hostname.toLowerCase();
    const hostAllowed = ALLOWED_HOSTS.some(
        allowed => host === allowed || host.endsWith("." + allowed)
    );
    if (!hostAllowed) return false;
    // The search results page, and nothing else.
    return parsed.pathname === "/s";
}

chrome.tabs.onUpdated.addListener((tabId, change) => {
    if (change.status == "complete") {
        chrome.tabs.get(tabId, tab => {
            if (isAmazonSearchPage(tab.url)) {
                chrome.tabs.executeScript(tabId, {file: "inject.js"});
            }
        });
    }
});
