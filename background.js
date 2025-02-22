let isMobileEnabled = false;
let isManualOverride = false;
let manualCycleCount = 0;

// iPad Chrome User-Agent
const MOBILE_CONFIG = {
    userAgent: 'Mozilla/5.0 (iPad; CPU OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/114.0.5735.124 Mobile/15E148 Safari/604.1'
};

async function reloadAllTabs() {
    const tabs = await chrome.tabs.query({});
    for (const tab of tabs) {
        if (!tab.url.startsWith('chrome://')) {
            try {
                await chrome.tabs.reload(tab.id);
            } catch (error) {
                console.error(`Error reloading tab ${tab.id}:`, error);
            }
        }
    }
}

async function updateUserAgent() {
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
                            }
                        ]
                    },
                    condition: {
                        urlFilter: '*',
                        resourceTypes: ['main_frame', 'sub_frame']
                    }
                }]
            });
        }
    } catch (error) {
        console.error("Error updating User-Agent:", error);
    }
}

// Handle pointer change detection from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "pointerChanged") {
        handlePointerChange(request.isCoarse);
        sendResponse({ success: true });
        return true;
    } else if (request.action === "toggleMobile") {
        handleManualToggle(request.enabled, sendResponse);
        return true;
    }
});

async function handlePointerChange(isCoarse) {
    if (!isManualOverride) {
        const newState = isCoarse;
        if (newState !== isMobileEnabled) {
            isMobileEnabled = newState;
            await chrome.storage.local.set({
                isMobileEnabled,
                isManualOverride,
                manualCycleCount
            });
            await updateUserAgent();
            await reloadAllTabs();
            // Notify popup of state change
            chrome.runtime.sendMessage({
                action: "stateUpdated",
                isMobileEnabled,
                isManualOverride,
                isAutoDetected: true
            });
        }
    }
}

async function handleManualToggle(enabled, sendResponse) {
    try {
        isManualOverride = true;
        isMobileEnabled = enabled;
        manualCycleCount++;

        // Reset to auto mode after a full cycle (on->off or off->on->off)
        if (manualCycleCount >= 2) {
            isManualOverride = false;
            manualCycleCount = 0;
        }

        await chrome.storage.local.set({
            isMobileEnabled,
            isManualOverride,
            manualCycleCount
        });
        await updateUserAgent();
        await reloadAllTabs();
        sendResponse({
            success: true,
            isManualOverride,
            manualCycleCount
        });
    } catch (error) {
        console.error("Error during manual toggle:", error);
        sendResponse({ success: false, error: error.message });
    }
}

// Initialize stored settings
chrome.runtime.onInstalled.addListener(async () => {
    chrome.storage.local.get(["isMobileEnabled", "isManualOverride", "manualCycleCount"], async (result) => {
        isMobileEnabled = result.isMobileEnabled || false;
        isManualOverride = result.isManualOverride || false;
        manualCycleCount = result.manualCycleCount || 0;
        await updateUserAgent();
    });
});

// Handle tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'loading' && tab.url && !tab.url.startsWith('chrome://')) {
        chrome.tabs.sendMessage(tabId, {
            action: "checkMobileState",
            isMobileEnabled: isMobileEnabled,
            isManualOverride: isManualOverride
        }).catch(() => {
            // Suppress errors for tabs that don't have the content script loaded yet
        });
    }
});