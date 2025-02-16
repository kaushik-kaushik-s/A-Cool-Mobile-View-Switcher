let isMobileEnabled = false;
let manualOverride = false;           // true if user toggled manually
let lastPhysicalMode = null;          // tracks the latest physical tablet mode value
let lastOverridePhysicalMode = null;  // records the physical mode when manual override occurred

const MOBILE_CONFIG = {
    userAgent:
        "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1",
    headers: {
        'Accept':
            'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'X-Requested-With': 'com.apple.mobilesafari',
        'Sec-CH-UA-Mobile': '?1',
        'Sec-CH-UA-Platform': '"iOS"',
        'Sec-CH-UA': '"Safari";v="15.0"',
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
                addRules: [
                    {
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
                    }
                ]
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

// Handle messages from the popup (manual toggle) and tablet detector
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "toggleMobile") {
        // User manually toggled. Save the new state and mark manual override.
        isMobileEnabled = request.enabled;
        manualOverride = true;
        lastOverridePhysicalMode = lastPhysicalMode; // record current physical mode at time of manual change

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
        // Tablet detector message providing the current physical mode
        const currentPhysical = request.isTabletMode;
        // On first message, or if the physical mode has changed:
        if (lastPhysicalMode === null || lastPhysicalMode !== currentPhysical) {
            lastPhysicalMode = currentPhysical;
            // If a manual override is active and the physical mode is now different
            // than what it was when the override was applied, clear the override.
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
                // No manual override—update automatically.
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

// Initialize extension state on install
chrome.runtime.onInstalled.addListener(async () => {
    await chrome.storage.local.set({ isMobileEnabled: false });
    await chrome.declarativeNetRequest
        .updateSessionRules({ removeRuleIds: [1] })
        .catch(error => console.error("Error clearing rules:", error));
});

// Load saved state on startup
chrome.storage.local.get(["isMobileEnabled"], async (result) => {
    isMobileEnabled = result.isMobileEnabled;
    await updateMobileMode();
});