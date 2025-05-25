// Content script for LinkedIn pages
// Handles communication between web app and extension

class LinkedInContentScript {
    constructor() {
      this.setupMessageListener();
      this.injectWebAppBridge();
    }
  
    setupMessageListener() {
      // Listen for messages from web app
      window.addEventListener('message', (event) => {
        if (event.source !== window) return;
        
        if (event.data.type === 'REQUEST_LINKEDIN_COOKIES') {
          this.handleWebAppCookieRequest();
        }
      });
  
      // Listen for messages from background script
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.type === 'LINKEDIN_COOKIES_UPDATE') {
          // Forward cookie updates to web app
          window.postMessage({
            type: 'LINKEDIN_COOKIES_UPDATE',
            cookies: message.cookies
          }, '*');
          sendResponse({ success: true });
        }
      });
    }
  
    async handleWebAppCookieRequest() {
      try {
        // Get current status from background script
        const response = await chrome.runtime.sendMessage({
          type: 'GET_STATUS'
        });
  
        if (response.success) {
          // Send cookies back to web app
          window.postMessage({
            type: 'LINKEDIN_COOKIES_RESPONSE',
            cookies: response.status.cookies,
            lastUpdated: response.status.lastUpdated,
            status: response.status.status
          }, '*');
        }
      } catch (error) {
        console.error('Error handling web app cookie request:', error);
        window.postMessage({
          type: 'LINKEDIN_COOKIES_ERROR',
          error: error.message
        }, '*');
      }
    }
  
    injectWebAppBridge() {
      // Inject a script to make extension available to web apps
      const script = document.createElement('script');
      script.textContent = `
        // Bridge for web apps to communicate with LinkedIn Cookie Sync extension
        window.linkedInCookieExtension = {
          requestCookies: function() {
            window.postMessage({ type: 'REQUEST_LINKEDIN_COOKIES' }, '*');
          },
          
          // Listen for cookie updates
          onCookiesUpdate: function(callback) {
            window.addEventListener('message', function(event) {
              if (event.data.type === 'LINKEDIN_COOKIES_UPDATE') {
                callback(event.data.cookies);
              }
            });
          },
          
          // Check if extension is available
          isAvailable: function() {
            return true;
          }
        };
        
        // Notify web apps that extension is ready
        window.dispatchEvent(new CustomEvent('linkedInCookieExtensionReady'));
      `;
      document.documentElement.appendChild(script);
      script.remove();
    }
  }
  
  // Initialize content script when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      new LinkedInContentScript();
    });
  } else {
    new LinkedInContentScript();
}