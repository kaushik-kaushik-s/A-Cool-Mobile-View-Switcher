let isMobileEnabled = false;
let domainSettings = {};

const MOBILE_CONFIG = {
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1",
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

// Initialize extension
chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.set({
        isMobileEnabled: false,
        domainSettings: {}
    });
});

// Load saved state
chrome.storage.local.get(['isMobileEnabled', 'domainSettings'], (result) => {
    isMobileEnabled = result.isMobileEnabled;
    domainSettings = result.domainSettings || {};
    updateMobileMode();
});

function getDomainFromUrl(url) {
    try {
        const hostname = new URL(url).hostname;
        return hostname.replace('www.', '');
    } catch (e) {
        return '';
    }
}

function shouldUseMobileView(url) {
    const domain = getDomainFromUrl(url);
    if (domain in domainSettings) {
        return domainSettings[domain];
    }
    return isMobileEnabled;
}

function updateMobileMode() {
    chrome.declarativeNetRequest.updateSessionRules({
        removeRuleIds: [1]
    }).then(() => {
        if (isMobileEnabled) {
            chrome.declarativeNetRequest.updateSessionRules({
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
    });
}

function reloadAllTabs() {
    chrome.tabs.query({}, (tabs) => {
        tabs.forEach(tab => {
            chrome.tabs.reload(tab.id);
        });
    });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch (request.action) {
        case 'toggleMobile':
            isMobileEnabled = request.enabled;
            chrome.storage.local.set({ isMobileEnabled });
            updateMobileMode();
            reloadAllTabs();
            break;

        case 'setDomainSetting':
            domainSettings[request.domain] = request.isMobile;
            chrome.storage.local.set({ domainSettings });
            reloadAllTabs();
            break;

        case 'getDomainSetting':
            const domain = getDomainFromUrl(request.url);
            sendResponse({
                domain,
                isMobile: domain in domainSettings ? domainSettings[domain] : null
            });
            break;
    }
});