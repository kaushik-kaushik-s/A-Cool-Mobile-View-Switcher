document.addEventListener('DOMContentLoaded', () => {
    const powerButton = document.getElementById('mobileToggle');
    const statusDot = document.querySelector('.status-dot');
    const statusText = document.querySelector('.status-text');

    // Load initial state
    chrome.storage.local.get(['isMobileEnabled'], (result) => {
        updateButtonState(result.isMobileEnabled ?? false);
        // Enable the button once the state is loaded
        powerButton.disabled = false;
    });

    powerButton.addEventListener('click', () => {
        // Disable the button temporarily to prevent double-clicks
        powerButton.disabled = true;

        chrome.storage.local.get(['isMobileEnabled'], (result) => {
            const newState = !result.isMobileEnabled;

            chrome.runtime.sendMessage({
                action: 'toggleMobile',
                enabled: newState
            }, (response) => {
                if (response && response.success) {
                    updateButtonState(newState);
                } else {
                    console.error('Failed to toggle mobile mode');
                    // Revert the button state if the toggle failed
                    updateButtonState(!newState);
                }
                powerButton.disabled = false;
            });
        });
    });

    // Listen for storage changes to update the UI in realtime
    chrome.storage.onChanged.addListener((changes, namespace) => {
        if (namespace === 'local' && changes.isMobileEnabled) {
            updateButtonState(changes.isMobileEnabled.newValue);
        }
    });

    function updateButtonState(isEnabled) {
        if (isEnabled) {
            powerButton.classList.add('active');
            statusDot.classList.add('active');
            statusText.classList.add('active');
            statusText.textContent = 'Enabled';
        } else {
            powerButton.classList.remove('active');
            statusDot.classList.remove('active');
            statusText.classList.remove('active');
            statusText.textContent = 'Disabled';
        }
    }
});
