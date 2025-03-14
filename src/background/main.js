import '../browser-polyfill.js'

browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.request === "audio") {
        sendResponse({ result: sender.tab.audible });
    }
});

browser.scripting.registerContentScripts([{
    id: "billkolumbert",
    matches: ["*://*/*"],
    runAt: "document_idle",
    js: ["/src/browser-polyfill.js", "/src/background/content_scripts/BillKolumbert.js"],
}]);
