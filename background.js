// background.js

let isMobileEnabled = false;
let manualOverride = false;
let lastPhysicalMode = false;
let lastOverridePhysicalMode = false;

// Updated mobile configuration for iPad Chrome
const MOBILE_CONFIG = {
    userAgent: 'Mozilla/5.0 (iPad; CPU OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/114.0.5735.124 Mobile/15E148 Safari/604.1',
    headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Sec-CH-UA-Mobile': '?1',
        'Sec-CH-UA-Platform': '"iPadOS"',
        'Sec-CH-UA': '"Chrome";v="114"',
        'DNT': '1'
    }
};

async function updateMobileMode() {
    try {
        await chrome.declarativeNetRequest.updateSessionRules({
            removeRuleIds: [1]
        });

        if (isMobileEnabled) {
            await chrome.declarativeNetRequest.updateSessionRules({
                addRules: [{
                    id: 1,
                    priority: 1,
                    action: {
                        type: 'modifyHeaders',
                        requestHeaders: [
                            {
                                header: 'User-Agent',
                                operation: 'set',
                                value: MOBILE_CONFIG.userAgent
                            },
                            ...Object.entries(MOBILE_CONFIG.headers).map(([header, value]) => ({
                                header: header,
                                operation: 'set',
                                value: value
                            }))
                        ]
                    },
                    condition: {
                        urlFilter: '*',
                        resourceTypes: ['main_frame', 'sub_frame', 'xmlhttprequest']
                    }
                }]
            });
        }
        return true;
    } catch (error) {
        console.error("Error updating rules:", error);
        return false;
    }
}

async function reloadAllTabs() {
    const tabs = await chrome.tabs.query({});
    for (const tab of tabs) {
        if (!tab.url.startsWith("chrome://")) {
            await chrome.tabs.reload(tab.id);
        }
    }
}

// Listen for messages from popup and tablet detector
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "toggleMobile") {
        isMobileEnabled = request.enabled;
        manualOverride = true;
        lastOverridePhysicalMode = lastPhysicalMode;

        chrome.storage.local.set({ isMobileEnabled }, async () => {
            const success = await updateMobileMode();
            if (success) {
                await reloadAllTabs();
                sendResponse({ success: true });
            } else {
                sendResponse({ success: false });
            }
        });
        return true;
    } else if (request.action === "tabletModeChanged") {
        const currentPhysical = request.isTabletMode;
        if (lastPhysicalMode !== currentPhysical) {
            lastPhysicalMode = currentPhysical;
            if (manualOverride && lastOverridePhysicalMode !== currentPhysical) {
                manualOverride = false;
                if (isMobileEnabled !== currentPhysical) {
                    isMobileEnabled = currentPhysical;
                    chrome.storage.local.set({ isMobileEnabled }, async () => {
                        const success = await updateMobileMode();
                        if (success) {
                            await reloadAllTabs();
                        }
                    });
                }
            } else if (!manualOverride) {
                if (isMobileEnabled !== currentPhysical) {
                    isMobileEnabled = currentPhysical;
                    chrome.storage.local.set({ isMobileEnabled }, async () => {
                        const success = await updateMobileMode();
                        if (success) {
                            await reloadAllTabs();
                        }
                    });
                }
            }
        }
    }
});

// Initialize on install
chrome.runtime.onInstalled.addListener(async () => {
    await chrome.storage.local.set({ isMobileEnabled: false });
    await chrome.declarativeNetRequest.updateSessionRules({
        removeRuleIds: [1]
    }).catch(error => console.error("Error clearing rules:", error));
});

// Load saved state on startup
chrome.storage.local.get(["isMobileEnabled"], async (result) => {
    isMobileEnabled = result.isMobileEnabled;
    await updateMobileMode();
});