document.addEventListener('DOMContentLoaded', () => {
    const powerButton = document.getElementById('mobileToggle');
    const statusDot = document.querySelector('.status-dot');
    const statusText = document.querySelector('.status-text');
    const modeText = document.querySelector('.mode-text');
    const loadingSpinner = document.createElement('div');
    loadingSpinner.className = 'loading-spinner hidden';
    document.body.appendChild(loadingSpinner);

    // Load initial state
    chrome.storage.local.get(['isMobileEnabled', 'isManualOverride', 'manualCycleCount'], (result) => {
        updateButtonState(result.isMobileEnabled ?? false, result.isManualOverride ?? false);
        powerButton.disabled = false;
    });

    powerButton.addEventListener('click', () => {
        powerButton.disabled = true;
        loadingSpinner.classList.remove('hidden');

        chrome.storage.local.get(['isMobileEnabled'], (result) => {
            const newState = !result.isMobileEnabled;

            chrome.runtime.sendMessage({
                action: 'toggleMobile',
                enabled: newState
            }, (response) => {
                if (response && response.success) {
                    updateButtonState(newState, response.isManualOverride);
                    if (response.manualCycleCount >= 2) {
                        showToast('Returning to auto-detect mode');
                    }
                } else {
                    console.error('Failed to toggle mobile mode');
                    updateButtonState(!newState, response.isManualOverride);
                }
                powerButton.disabled = false;
                loadingSpinner.classList.add('hidden');
            });
        });
    });

    // Listen for storage changes
    chrome.storage.onChanged.addListener((changes, namespace) => {
        if (namespace === 'local') {
            const newState = changes.isMobileEnabled?.newValue;
            const newManualOverride = changes.isManualOverride?.newValue;
            if (newState !== undefined || newManualOverride !== undefined) {
                updateButtonState(
                    newState ?? isMobileEnabled,
                    newManualOverride ?? isManualOverride
                );
            }
        }
    });

    function updateButtonState(isEnabled, isManual) {
        powerButton.classList.toggle('active', isEnabled);
        statusDot.classList.toggle('active', isEnabled);
        statusText.classList.toggle('active', isEnabled);
        statusText.textContent = isEnabled ? 'Enabled' : 'Disabled';

        modeText.textContent = isManual ? 'Manual Mode' : 'Auto-Detect Mode';
        modeText.classList.toggle('manual', isManual);
    }

    function showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }
});