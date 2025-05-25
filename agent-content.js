// Content script for web app pages
// Handles LinkedIn cookie synchronization with localStorage

class WebAppContentScript {
    constructor() {
        this.isProduction = window.location.hostname !== 'localhost';
        this.setupMessageListener();
        this.setupWebAppBridge();
        this.requestInitialCookies();
        this.logDebug('WebApp content script initialized', { 
            url: window.location.href,
            isProduction: this.isProduction 
        });
    }

    setupMessageListener() {
        // Listen for messages from background script
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            this.logDebug('Received message from background', message);
            
            if (message.type === 'LINKEDIN_COOKIES_UPDATE') {
                this.updateLocalStorageCookies(message.cookies);
                sendResponse({ success: true });
            }
            
            return true;
        });
    }

    setupWebAppBridge() {
        // Create bridge for web app to communicate with extension
        const script = document.createElement('script');
        script.src = chrome.runtime.getURL('bridge.js');
        script.dataset.extensionBridge = 'true';
        script.dataset.isProduction = this.isProduction.toString();
        
        document.documentElement.appendChild(script);
        script.remove();

        // Listen for web app requests
        window.addEventListener('message', (event) => {
            if (event.source !== window) return;
            
            if (event.data.type === 'EXTENSION_REQUEST_COOKIES') {
                this.handleWebAppCookieRequest();
            }
        });
    }

    async handleWebAppCookieRequest() {
        try {
            this.logDebug('Web app requested cookies');
            
            // Request fresh cookies from background script
            const response = await chrome.runtime.sendMessage({
                type: 'GET_STATUS'
            });

            if (response.success) {
                // Update localStorage with fresh cookies
                this.updateLocalStorageCookies(response.status.cookies);
                
                // Send response back to web app
                window.postMessage({
                    type: 'EXTENSION_COOKIES_RESPONSE',
                    cookies: response.status.cookies,
                    lastUpdated: response.status.lastUpdated,
                    status: response.status.status,
                    cookieCount: response.status.cookieCount
                }, '*');
                
                this.logDebug('Sent cookies to web app', { 
                    count: response.status.cookieCount 
                });
            } else {
                throw new Error(response.error || 'Failed to get cookies');
            }
        } catch (error) {
            this.logDebug('Error handling web app cookie request', error);
            
            window.postMessage({
                type: 'EXTENSION_COOKIES_ERROR',
                error: error.message
            }, '*');
        }
    }

    updateLocalStorageCookies(cookies) {
        try {
            // Store cookies in localStorage with the exact key your app expects
            localStorage.setItem('linkedin_cookies', JSON.stringify(cookies));
            
            this.logDebug('Updated localStorage with cookies', { 
                count: cookies.length,
                key: 'linkedin_cookies'
            });
            
            // Dispatch custom event to notify React app of cookie update
            window.dispatchEvent(new CustomEvent('linkedInCookiesUpdated', {
                detail: { 
                    cookies,
                    timestamp: Date.now(),
                    source: 'extension'
                }
            }));
            
        } catch (error) {
            this.logDebug('Error updating localStorage', error);
        }
    }

    async requestInitialCookies() {
        // Request cookies when content script loads
        setTimeout(() => {
            this.handleWebAppCookieRequest();
        }, 1000);
    }

    logDebug(message, data = null) {
        const prefix = `[LinkedIn Cookie Extension - WebApp]`;
        if (data) {
            console.log(`${prefix} ${message}:`, data);
        } else {
            console.log(`${prefix} ${message}`);
        }
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new WebAppContentScript();
    });
} else {
    new WebAppContentScript();
}