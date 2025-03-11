import '../browser-polyfill.js'

const DEBUG = false;
if (DEBUG) {
    let ws = new WebSocket('ws://devd.io:8000/.devd.livereload');
    ws.onmessage = () => {
        ws.close();
        // reload current tab with some delay
        // require permissions in manifest
        browser.tabs.query({ active: true, lastFocusedWindow: true }, ([tab]) => {
            if (tab == undefined) return;
            browser.scripting.executeScript({
                target: { tabId: tab.id, allFrames: true },
                files: ['/js/background/content_scripts/debug_reload.js'],
            });
            // reload extensions
            browser.runtime.reload();
        });
    };
}
const array = new Uint32Array(1);
self.crypto.getRandomValues(array);
browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.request === "audio") {
        sendResponse({ result: sender.tab.audible });
    }
});
browser.scripting.registerContentScripts([{
    id: array.at(1) + "",
    matches: ["*://*/*"],
    runAt: "document_idle",
    js: ["/js/browser-polyfill.js", "/js/background/content_scripts/BillKolumbert.js"],
}]);
