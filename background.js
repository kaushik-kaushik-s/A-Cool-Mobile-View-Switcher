let isMobileEnabled = false;

const MOBILE_USER_AGENT = "Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1";
const DESKTOP_USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36";

chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.set({ isMobileEnabled: false });
});

chrome.storage.local.get(['isMobileEnabled'], (result) => {
    isMobileEnabled = result.isMobileEnabled;
});

chrome.webNavigation.onBeforeNavigate.addListener((details) => {
    if (isMobileEnabled && details.frameId === 0) {
        chrome.tabs.get(details.tabId, (tab) => {
            chrome.declarativeNetRequest.updateSessionRules({
                removeRuleIds: [1],
                addRules: [{
                    id: 1,
                    priority: 1,
                    action: {
                        type: 'modifyHeaders',
                        requestHeaders: [{
                            header: 'User-Agent',
                            operation: 'set',
                            value: MOBILE_USER_AGENT
                        }]
                    },
                    condition: {
                        urlFilter: '*',
                        resourceTypes: ['main_frame']
                    }
                }]
            });
        });
    }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'toggleMobile') {
        isMobileEnabled = request.enabled;
        chrome.storage.local.set({ isMobileEnabled: isMobileEnabled });

        if (!isMobileEnabled) {
            chrome.declarativeNetRequest.updateSessionRules({
                removeRuleIds: [1]
            });
        }

        chrome.tabs.reload();
    }
});