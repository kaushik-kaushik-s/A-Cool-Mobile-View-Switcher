document.addEventListener('DOMContentLoaded', () => {
    updateDeviceMode();
    updateViewMode();

    document.getElementById('switchToMobile').addEventListener('click', () => {
        chrome.runtime.getBackgroundPage((backgroundPage) => {
            backgroundPage.switchToMobileView();
            updateViewMode('Mobile');
        });
    });

    document.getElementById('switchToNormal').addEventListener('click', () => {
        chrome.runtime.getBackgroundPage((backgroundPage) => {
            backgroundPage.switchToNormalView();
            updateViewMode('Normal');
        });
    });

    window.matchMedia('(pointer: coarse)').addEventListener('change', (e) => {
        if (e.matches) {
            updateDeviceMode('Tablet');
            updateViewMode('Mobile');
        } else {
            updateDeviceMode('Normal');
            updateViewMode('Normal');
        }
    });
});

function updateDeviceMode(mode) {
    if (mode) {
        document.getElementById('deviceMode').textContent = `Device Mode: ${mode}`;
    } else {
        chrome.storage.local.get('isWindows11', (result) => {
            if (result.isWindows11) {
                if (window.matchMedia('(pointer: coarse)').matches) {
                    document.getElementById('deviceMode').textContent = 'Device Mode: Tablet';
                } else {
                    document.getElementById('deviceMode').textContent = 'Device Mode: Normal';
                }
            } else {
                document.getElementById('deviceMode').textContent = 'Device Mode: Not Windows 11';
            }
        });
    }
}

function updateViewMode(mode) {
    if (mode) {
        document.getElementById('viewMode').textContent = `View Mode: ${mode}`;
    } else {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.scripting.executeScript({
                target: { tabId: tabs[0].id },
                func: () => {
                    return document.querySelector('meta[name="viewport"]').getAttribute('content');
                }
            }, (results) => {
                if (results[0].result.includes('width=device-width')) {
                    document.getElementById('viewMode').textContent = 'View Mode: Mobile';
                } else {
                    document.getElementById('viewMode').textContent = 'View Mode: Normal';
                }
            });
        });
    }
}