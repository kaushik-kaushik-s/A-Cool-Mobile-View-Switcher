// content.js

function injectMobileMetaTags() {
    const viewport = document.createElement('meta');
    viewport.name = 'viewport';
    viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0';

    // Remove any existing viewport meta tags
    document.querySelectorAll('meta[name="viewport"]').forEach(tag => tag.remove());
    document.head.appendChild(viewport);

    // Define additional mobile meta tags optimized for iPad
    const mobileMetaTags = [
        { name: 'HandheldFriendly', content: 'true' },
        { name: 'MobileOptimized', content: 'width' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black' }
    ];

    mobileMetaTags.forEach(tagInfo => {
        document.querySelectorAll(`meta[name="${tagInfo.name}"]`).forEach(tag => tag.remove());
        const meta = document.createElement('meta');
        meta.name = tagInfo.name;
        meta.content = tagInfo.content;
        document.head.appendChild(meta);
    });
}

// Handle Reddit mobile optimization
function handleReddit() {
    const url = new URL(window.location.href);
    chrome.storage.local.get(['isMobileEnabled'], (result) => {
        if (result.isMobileEnabled && url.hostname.includes('reddit.com')) {
            // For iPad, we'll use the regular reddit.com with mobile optimizations
            if (url.searchParams.has('mobile_web')) {
                return; // Already optimized for mobile
            }
            url.searchParams.set('mobile_web', '1');
            window.location.replace(url.toString());
        }
    });
}

// Handle YouTube optimization
function handleYoutube() {
    const url = new URL(window.location.href);
    if (url.hostname.includes('youtube.com')) {
        if (url.searchParams.has('app')) {
            url.searchParams.delete('app');
            window.location.replace(url.toString());
        }
    }
}

// Execute site-specific handlers
if (window.location.hostname.includes('reddit.com')) {
    handleReddit();
} else if (window.location.hostname.includes('youtube.com')) {
    handleYoutube();
}

// Listen for storage changes
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local' && changes.isMobileEnabled) {
        if (changes.isMobileEnabled.newValue) {
            injectMobileMetaTags();
            // Re-run site-specific handlers
            if (window.location.hostname.includes('reddit.com')) {
                handleReddit();
            } else if (window.location.hostname.includes('youtube.com')) {
                handleYoutube();
            }
        } else {
            window.location.reload();
        }
    }
});

// Initialize on page load
chrome.storage.local.get(['isMobileEnabled'], (result) => {
    if (result.isMobileEnabled) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', injectMobileMetaTags);
        } else {
            injectMobileMetaTags();
        }
    }
});

// Clean desktop parameters from URLs
function cleanDesktopParams(url) {
    let changed = false;
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

// Initial URL cleanup
(function removeAndReloadDesktopParams() {
    const url = new URL(window.location.href);
    if (cleanDesktopParams(url)) {
        window.location.replace(url.toString());
    }
})();

// Override history API
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