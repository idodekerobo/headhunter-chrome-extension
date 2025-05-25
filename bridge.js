// LinkedIn Cookie Extension Bridge for Web App
// This script runs in the page context to provide the bridge API

window.linkedInCookieExtension = {
    // Request fresh cookies from extension
    requestCookies: async function() {
        return new Promise((resolve, reject) => {
            window.postMessage({ 
                type: 'EXTENSION_REQUEST_COOKIES',
                timestamp: Date.now()
            }, '*');
            
            // Listen for response
            const handleResponse = (event) => {
                if (event.data.type === 'EXTENSION_COOKIES_RESPONSE') {
                    window.removeEventListener('message', handleResponse);
                    resolve(event.data);
                } else if (event.data.type === 'EXTENSION_COOKIES_ERROR') {
                    window.removeEventListener('message', handleResponse);
                    reject(new Error(event.data.error));
                }
            };
            
            window.addEventListener('message', handleResponse);
            
            // Timeout after 5 seconds
            setTimeout(() => {
                window.removeEventListener('message', handleResponse);
                reject(new Error('Extension request timeout'));
            }, 5000);
        });
    },
    
    // Check if extension is available
    isAvailable: function() {
        return typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id;
    },
    
    // Get cookies from localStorage
    getCookiesFromStorage: function() {
        try {
            const stored = localStorage.getItem('linkedin_cookies');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error reading cookies from localStorage:', error);
            return [];
        }
    }
};

// Get the isProduction flag from the script tag data attribute
const scriptTag = document.querySelector('script[data-extension-bridge]');
const isProduction = scriptTag ? scriptTag.dataset.isProduction === 'true' : false;

// Notify web app that extension bridge is ready
window.dispatchEvent(new CustomEvent('linkedInCookieExtensionReady', {
    detail: { 
        isProduction: isProduction,
        timestamp: Date.now()
    }
})); 