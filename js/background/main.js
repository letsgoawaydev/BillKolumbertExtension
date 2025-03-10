const DEBUG = false;
if (DEBUG) {
    let ws = new WebSocket('ws://devd.io:8000/.devd.livereload');
    ws.onmessage = () => {
        ws.close();
        // reload current tab with some delay
        // require permissions in manifest
        chrome.tabs.query({ active: true, lastFocusedWindow: true }, ([tab]) => {
            if (tab == undefined) return;
            chrome.scripting.executeScript({
                target: { tabId: tab.id, allFrames: true },
                files: ['/js/background/content_scripts/debug_reload.js'],
            });
            // reload extensions
            chrome.runtime.reload();
        });
    };
}
const array = new Uint32Array(1);
self.crypto.getRandomValues(array);
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.request === "audio") {
        sendResponse({ result: sender.tab.audible });
    }
});
chrome.scripting.registerContentScripts([{
    id: array.at(1) + "",
    matches: ["*://*/*"],
    runAt: "document_idle",
    js: ["/js/background/content_scripts/BillKolumbert.js"],
}]);
