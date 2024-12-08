chrome.runtime.onInstalled.addListener(() => {
    detectTabletMode();
});

function detectTabletMode() {
    navigator.userAgentData.getHighEntropyValues(['platformVersion'])
        .then(ua => {
            if (navigator.userAgentData.platform === 'Windows') {
                const majorPlatformVersion = parseInt(ua.platformVersion.split('.')[0]);
                if (majorPlatformVersion >= 13) {
                    chrome.storage.local.set({ isWindows11: true });
                } else {
                    chrome.storage.local.set({ isWindows11: false });
                }
            }
        });
}

function switchToMobileView() {
    chrome.tabs.query({}, (tabs) => {
        tabs.forEach((tab) => {
            chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: () => {
                    document.querySelector('meta[name="viewport"]').setAttribute('content', 'width=device-width, initial-scale=1.0');
                }
            });
        });
    });
}

function switchToNormalView() {
    chrome.tabs.query({}, (tabs) => {
        tabs.forEach((tab) => {
            chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: () => {
                    document.querySelector('meta[name="viewport"]').setAttribute('content', 'width=1024');
                }
            });
        });
    });
}