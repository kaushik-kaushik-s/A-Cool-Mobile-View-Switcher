document.addEventListener('DOMContentLoaded', () => {
    const powerButton = document.getElementById('mobileToggle');
    const statusText = document.querySelector('.status-text');

    // Load initial state
    chrome.storage.local.get(['isMobileEnabled'], (result) => {
        updateButtonState(result.isMobileEnabled);
    });

    powerButton.addEventListener('click', () => {
        chrome.storage.local.get(['isMobileEnabled'], (result) => {
            const newState = !result.isMobileEnabled;
            chrome.runtime.sendMessage({
                action: 'toggleMobile',
                enabled: newState
            });
            updateButtonState(newState);
        });
    });

    function updateButtonState(isEnabled) {
        if (isEnabled) {
            powerButton.classList.add('active');
            statusText.classList.add('active');
            statusText.textContent = 'On';
        } else {
            powerButton.classList.remove('active');
            statusText.classList.remove('active');
            statusText.textContent = 'Off';
        }
    }
});