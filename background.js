let isMobileEnabled = false;

const MOBILE_CONFIG = {
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1",
    // Common mobile headers
    headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'X-Requested-With': 'com.apple.mobilesafari',
        'Sec-CH-UA-Mobile': '?1',
        'Sec-CH-UA-Platform': '"iOS"',
        'Sec-CH-UA': '"Safari";v="15.0"',
        'DNT': '1'
    }
};

chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.set({ isMobileEnabled: false });
});

chrome.storage.local.get(['isMobileEnabled'], (result) => {
    isMobileEnabled = result.isMobileEnabled;
    updateMobileMode();
});

function updateMobileMode() {
    if (isMobileEnabled) {
        // Set up header modification rules
        chrome.declarativeNetRequest.updateSessionRules({
            removeRuleIds: [1],
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
    } else {
        chrome.declarativeNetRequest.updateSessionRules({
            removeRuleIds: [1]
        });
    }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'toggleMobile') {
        isMobileEnabled = request.enabled;
        chrome.storage.local.set({ isMobileEnabled });
        updateMobileMode();
        chrome.tabs.reload();
    }
});
