let currentDomain = '';

document.addEventListener('DOMContentLoaded', () => {
    const toggle = document.getElementById('mobileToggle');
    const forceMobile = document.getElementById('forceMobile');
    const forceDesktop = document.getElementById('forceDesktop');
    const removeDomain = document.getElementById('removeDomain');
    const currentDomainElement = document.getElementById('currentDomain');

    // Load initial states
    chrome.storage.local.get(['isMobileEnabled', 'domainSettings'], (result) => {
        toggle.checked = result.isMobileEnabled;
        updateDomainList(result.domainSettings || {});
    });

    // Get current tab's domain
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
            chrome.runtime.sendMessage({
                action: 'getDomainSetting',
                url: tabs[0].url
            }, (response) => {
                currentDomain = response.domain;
                currentDomainElement.textContent = currentDomain;

                // Update button states based on current domain settings
                if (response.isMobile !== null) {
                    if (response.isMobile) {
                        forceMobile.disabled = true;
                        forceDesktop.disabled = false;
                    } else {
                        forceMobile.disabled = false;
                        forceDesktop.disabled = true;
                    }
                } else {
                    forceMobile.disabled = false;
                    forceDesktop.disabled = false;
                }
            });
        }
    });

    // Event Listeners
    toggle.addEventListener('change', () => {
        chrome.runtime.sendMessage({
            action: 'toggleMobile',
            enabled: toggle.checked
        });
    });

    forceMobile.addEventListener('click', () => {
        setDomainSetting(currentDomain, true);
    });

    forceDesktop.addEventListener('click', () => {
        setDomainSetting(currentDomain, false);
    });

    removeDomain.addEventListener('click', () => {
        removeDomainSetting(currentDomain);
    });
});

function setDomainSetting(domain, isMobile) {
    chrome.runtime.sendMessage({
        action: 'setDomainSetting',
        domain: domain,
        isMobile: isMobile
    });
    updateUI();
}

function removeDomainSetting(domain) {
    chrome.storage.local.get(['domainSettings'], (result) => {
        const settings = result.domainSettings || {};
        delete settings[domain];
        chrome.storage.local.set({ domainSettings: settings }, () => {
            chrome.runtime.sendMessage({
                action: 'setDomainSetting',
                domain: domain,
                isMobile: null
            });
            updateUI();
        });
    });
}

function updateDomainList(settings) {
    const domainList = document.getElementById('domainList');
    domainList.innerHTML = '';

    Object.entries(settings).forEach(([domain, isMobile]) => {
        const item = document.createElement('div');
        item.className = 'domain-item';
        item.innerHTML = `
      <span>${domain} (${isMobile ? 'Mobile' : 'Desktop'})</span>
      <button onclick="removeDomainSetting('${domain}')">Remove</button>
    `;
        domainList.appendChild(item);
    });
}

function updateUI() {
    chrome.storage.local.get(['domainSettings'], (result) => {
        updateDomainList(result.domainSettings || {});
    });
}