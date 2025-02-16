// --- Helper function to remove desktop-forcing parameters from a URL ---
function cleanDesktopParams(url) {
    let changed = false;
    // List of parameter keys known to force a desktop view
    const desktopForcingParams = ['app', 'mode', 'view', 'display', 'force'];
    desktopForcingParams.forEach(key => {
        if (url.searchParams.has(key)) {
            const val = url.searchParams.get(key);
            if (val && val.toLowerCase() === 'desktop') {
                url.searchParams.delete(key);
                changed = true;
            }
        }
    });
    return changed;
}

// --- On initial load, if the URL contains any desktop-forcing parameters, remove them and reload ---
(function removeAndReloadDesktopParams() {
    const url = new URL(window.location.href);
    if (cleanDesktopParams(url)) {
        window.location.replace(url.toString());
    }
})();

// --- Override the history API to ensure that navigation doesn't add desktop-forcing parameters ---
(function(history) {
    const originalPushState = history.pushState;
    history.pushState = function(state, title, url) {
        if (typeof url === "string") {
            let newUrl = new URL(url, location.href);
            if (cleanDesktopParams(newUrl)) {
                window.location.replace(newUrl.toString());
                return;
            }
            arguments[2] = newUrl.toString();
        }
        return originalPushState.apply(history, arguments);
    };

    const originalReplaceState = history.replaceState;
    history.replaceState = function(state, title, url) {
        if (typeof url === "string") {
            let newUrl = new URL(url, location.href);
            if (cleanDesktopParams(newUrl)) {
                window.location.replace(newUrl.toString());
                return;
            }
            arguments[2] = newUrl.toString();
        }
        return originalReplaceState.apply(history, arguments);
    };

    window.addEventListener("popstate", () => {
        const url = new URL(window.location.href);
        if (cleanDesktopParams(url)) {
            window.location.replace(url.toString());
        }
    });
})(window.history);

// --- Existing mobile meta tag injection logic below ---

function injectMobileMetaTags() {
    const viewport = document.createElement('meta');
    viewport.name = 'viewport';
    viewport.content =
        'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0';

    // Remove any existing viewport meta tags.
    document.querySelectorAll('meta[name="viewport"]').forEach(tag => tag.remove());
    document.head.appendChild(viewport);

    // Define additional mobile meta tags.
    const mobileMetaTags = [
        { name: 'HandheldFriendly', content: 'true' },
        { name: 'MobileOptimized', content: 'width' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' }
    ];

    mobileMetaTags.forEach(tagInfo => {
        document.querySelectorAll(`meta[name="${tagInfo.name}"]`).forEach(tag => tag.remove());
        const meta = document.createElement('meta');
        meta.name = tagInfo.name;
        meta.content = tagInfo.content;
        document.head.appendChild(meta);
    });
}

// Listen for storage changes to inject or remove mobile meta tags in real time.
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local' && changes.isMobileEnabled) {
        if (changes.isMobileEnabled.newValue) {
            injectMobileMetaTags();
        } else {
            // Reload the page when mobile mode is disabled so meta tags are cleared.
            window.location.reload();
        }
    }
});

// On initial load, inject mobile meta tags if mobile mode is enabled.
chrome.storage.local.get(['isMobileEnabled'], (result) => {
    if (result.isMobileEnabled) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', injectMobileMetaTags);
        } else {
            injectMobileMetaTags();
        }
    }
});