function checkTabletMode() {
    return window.matchMedia("(pointer: coarse)").matches;
}

// Check for tablet mode changes
const tabletModeQuery = window.matchMedia("(pointer: coarse)");

// Initial check
chrome.runtime.sendMessage({
    action: 'tabletModeChanged',
    isTabletMode: checkTabletMode()
});

// Listen for changes
tabletModeQuery.addEventListener('change', (e) => {
    chrome.runtime.sendMessage({
        action: 'tabletModeChanged',
        isTabletMode: e.matches
    });
});