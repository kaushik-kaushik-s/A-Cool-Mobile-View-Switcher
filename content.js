function injectMobileMetaTags() {
    const viewport = document.createElement('meta');
    viewport.name = 'viewport';
    viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0';
    document.head.appendChild(viewport);

    // Override any existing viewport tags
    const existingViewports = document.querySelectorAll('meta[name="viewport"]');
    existingViewports.forEach(tag => {
        if (tag !== viewport) {
            tag.remove();
        }
    });

    // Add mobile-specific meta tags
    const mobileMetaTags = [
        { name: 'HandheldFriendly', content: 'true' },
        { name: 'MobileOptimized', content: 'width' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' }
    ];

    mobileMetaTags.forEach(tag => {
        const meta = document.createElement('meta');
        meta.name = tag.name;
        meta.content = tag.content;
        document.head.appendChild(meta);
    });
}

chrome.storage.local.get(['isMobileEnabled'], (result) => {
    if (result.isMobileEnabled) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', injectMobileMetaTags);
        } else {
            injectMobileMetaTags();
        }
    }
});