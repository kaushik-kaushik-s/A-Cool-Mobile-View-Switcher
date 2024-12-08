chrome.runtime.onInstalled.addListener(() => {
    detectTabletMode();
});

function detectTabletMode() {
    navigator.userAgentData.getHighEntropyValues(['platformVersion'])
        .then(ua => {
            if (navigator.userAgentData.platform === 'Windows') {
                const majorPlatformVersion = parseInt(ua.platformVersion.split('.')[0]);
                if (majorPlatformVersion >= 13) {
                    if (window.matchMedia('(pointer: coarse)').matches) {
                        switchToMobileView();
                        updateDeviceMode('Tablet');
                        updateViewMode('Mobile');
                    } else {
                        switchToNormalView();
                        updateDeviceMode('Normal');
                        updateViewMode('Normal');
                    }
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

// Listen for changes in tablet mode
window.matchMedia('(pointer: coarse)').addEventListener('change', (e) => {
    if (e.matches) {
        switchToMobileView();
        updateDeviceMode('Tablet');
        updateViewMode('Mobile');
    } else {
        switchToNormalView();
        updateDeviceMode('Normal');
        updateViewMode('Normal');
    }
});

function updateDeviceMode(mode) {
    chrome.storage.local.set({ deviceMode: mode });
}

function updateViewMode(mode) {
    chrome.storage.local.set({ viewMode: mode });
}

// Function to get the current device mode
function getDeviceMode(callback) {
    chrome.storage.local.get('deviceMode', (result) => {
        callback(result.deviceMode);
    });
}

// Function to get the current view mode
function getViewMode(callback) {
    chrome.storage.local.get('viewMode', (result) => {
        callback(result.viewMode);
    });
}
