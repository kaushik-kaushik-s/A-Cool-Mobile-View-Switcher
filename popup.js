document.addEventListener('DOMContentLoaded', () => {
    const toggle = document.getElementById('mobileToggle');

    chrome.storage.local.get(['isMobileEnabled'], (result) => {
        toggle.checked = result.isMobileEnabled;
    });

    toggle.addEventListener('change', () => {
        chrome.runtime.sendMessage({
            action: 'toggleMobile',
            enabled: toggle.checked
        });
    });
});