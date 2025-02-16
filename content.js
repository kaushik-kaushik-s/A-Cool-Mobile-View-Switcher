function injectMobileMetaTags() {
    const viewport = document.createElement('meta');
    viewport.name = 'viewport';
    viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0';

    // Remove all existing viewport tags first
    const existingViewports = document.querySelectorAll('meta[name="viewport"]');
    existingViewports.forEach(tag => tag.remove());

    // Add our viewport tag
    document.head.appendChild(viewport);

    // Add mobile-specific meta tags
    const mobileMetaTags = [
        { name: 'HandheldFriendly', content: 'true' },
        { name: 'MobileOptimized', content: 'width' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' }
    ];

    // Remove any existing tags with the same names
    mobileMetaTags.forEach(tagInfo => {
        const existingTags = document.querySelectorAll(`meta[name="${tagInfo.name}"]`);
        existingTags.forEach(tag => tag.remove());
    });

    // Add new tags
    mobileMetaTags.forEach(tag => {
        const meta = document.createElement('meta');
        meta.name = tag.name;
        meta.content = tag.content;
        document.head.appendChild(meta);
    });
}

// Listen for storage changes
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local' && changes.isMobileEnabled) {
        if (changes.isMobileEnabled.newValue) {
            injectMobileMetaTags();
        } else {
            // Reload the page when disabled to remove the mobile meta tags
            window.location.reload();
        }
    }
});

// Initial check
chrome.storage.local.get(['isMobileEnabled'], (result) => {
    if (result.isMobileEnabled) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', injectMobileMetaTags);
        } else {
            injectMobileMetaTags();
        }
    }
});