// Background script for LinkedIn Cookie Sync Extension
// Automatically extracts cookies without user intervention

class LinkedInCookieManager {
    constructor() {
      this.setupEventListeners();
      this.startPeriodicCookieUpdate();
      // Extract cookies immediately on startup
      this.extractLinkedInCookies();
      this.logDebug('LinkedInCookieManager initialized');
    }
  
    setupEventListeners() {
      // Listen for messages from popup and content script
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        this.handleMessage(message, sender, sendResponse);
        return true; // Keep message channel open for async response
      });
  
      // Auto-extract cookies when user visits LinkedIn
      chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
        if (changeInfo.status === 'complete' && 
            tab.url && 
            tab.url.includes('linkedin.com') && 
            !tab.url.includes('linkedin.com/login')) {
          this.logDebug('LinkedIn page loaded, extracting cookies', { url: tab.url });
          // Small delay to ensure page is fully loaded
          setTimeout(() => {
            this.extractLinkedInCookies();
          }, 2000);
        }
      });
  
      // Extract cookies when extension is installed/enabled
      chrome.runtime.onInstalled.addListener(() => {
        this.logDebug('Extension installed/enabled');
        this.extractLinkedInCookies();
      });
  
      chrome.runtime.onStartup.addListener(() => {
        this.logDebug('Extension startup');
        this.extractLinkedInCookies();
      });
    }
  
    async handleMessage(message, sender, sendResponse) {
      try {
        this.logDebug('Handling message', { type: message.type, sender: sender.tab?.url });
        
        switch (message.type) {
          case 'GET_STATUS':
            const status = await this.getExtensionStatus();
            this.logDebug('Sending status', { cookieCount: status.cookieCount, status: status.status });
            sendResponse({ success: true, status });
            break;
          
          case 'SYNC_TO_WEBAPP':
            await this.syncCookiesToWebApp();
            sendResponse({ success: true });
            break;
          
          case 'FORCE_REFRESH':
            await this.extractLinkedInCookies();
            const newStatus = await this.getExtensionStatus();
            sendResponse({ success: true, status: newStatus });
            break;
          
          default:
            this.logDebug('Unknown message type', message.type);
            sendResponse({ success: false, error: 'Unknown message type' });
        }
      } catch (error) {
        this.logDebug('Error handling message', error);
        sendResponse({ success: false, error: error.message });
      }
    }
  
    async extractLinkedInCookies() {
      try {
        this.logDebug('Starting LinkedIn cookie extraction...');
        
        // Get all cookies for LinkedIn domain
        const cookies = await chrome.cookies.getAll({
          domain: '.linkedin.com'
        });
  
        this.logDebug('Raw LinkedIn cookies found', { count: cookies.length });
  
        // Filter out unnecessary cookies and format for your app
        const importantCookieNames = [
          'li_at', 'JSESSIONID', 'bcookie', 'bscookie', 'li_rm', 
          'liap', 'li_mc', 'UserMatchHistory', 'AnalyticsSyncHistory',
          'lms_ads', 'lms_analytics', 'li_sugr'
        ];
  
        const formattedCookies = cookies
          .filter(cookie => {
            // Include important cookies or any that look session-related
            const isImportant = importantCookieNames.includes(cookie.name) || 
                               cookie.name.startsWith('li_') ||
                               cookie.httpOnly ||
                               cookie.secure;
            
            if (isImportant) {
              this.logDebug('Including cookie', { name: cookie.name, secure: cookie.secure, httpOnly: cookie.httpOnly });
            }
            
            return isImportant;
          })
          .map(cookie => ({
            domain: cookie.domain,
            expirationDate: cookie.expirationDate,
            hostOnly: cookie.hostOnly,
            httpOnly: cookie.httpOnly,
            name: cookie.name,
            path: cookie.path,
            sameSite: cookie.sameSite,
            secure: cookie.secure,
            session: cookie.session,
            storeId: cookie.storeId,
            value: cookie.value
          }));
  
        // Store cookies and status
        await chrome.storage.local.set({
          linkedinCookies: formattedCookies,
          lastUpdated: Date.now(),
          lastError: null,
          isLoggedIn: this.checkIfLoggedIn(cookies)
        });
  
        this.logDebug('Cookies extracted and stored', { 
          filtered: formattedCookies.length,
          total: cookies.length,
          isLoggedIn: this.checkIfLoggedIn(cookies)
        });
        
        // Automatically sync to web app
        await this.syncCookiesToWebApp();
        
        // Notify popup if it's open
        this.notifyPopup('cookies_updated', { 
          count: formattedCookies.length,
          timestamp: Date.now()
        });
        
        return formattedCookies;
      } catch (error) {
        this.logDebug('Error extracting LinkedIn cookies', error);
        
        // Store error status
        await chrome.storage.local.set({
          lastError: error.message,
          lastUpdated: Date.now()
        });
        
        throw error;
      }
    }
  
    checkIfLoggedIn(cookies) {
      // Check for key authentication cookies that indicate user is logged in
      const authCookies = ['li_at', 'JSESSIONID'];
      const isLoggedIn = authCookies.some(name => 
        cookies.find(cookie => cookie.name === name && cookie.value)
      );
      
      this.logDebug('Login status check', { 
        isLoggedIn,
        authCookiesFound: authCookies.filter(name => 
          cookies.find(cookie => cookie.name === name && cookie.value)
        )
      });
      
      return isLoggedIn;
    }

    async getExtensionStatus() {
        try {
          const result = await chrome.storage.local.get([
            'linkedinCookies', 'lastUpdated', 'lastError', 'isLoggedIn'
          ]);
          
          const cookies = result.linkedinCookies || [];
          const lastUpdated = result.lastUpdated || null;
          const lastError = result.lastError || null;
          const isLoggedIn = result.isLoggedIn || false;
          
          // Determine overall status
          let status = 'unknown';
          let statusMessage = 'Checking...';
          
          if (lastError) {
            status = 'error';
            statusMessage = lastError;
          } else if (!isLoggedIn) {
            status = 'not_logged_in';
            statusMessage = 'Not logged into LinkedIn';
          } else if (cookies.length === 0) {
            status = 'no_cookies';
            statusMessage = 'No cookies found';
          } else {
            const age = Date.now() - (lastUpdated || 0);
            const hoursOld = age / (1000 * 60 * 60);
            
            if (hoursOld < 1) {
              status = 'fresh';
              statusMessage = 'Fresh cookies available';
            } else if (hoursOld < 24) {
              status = 'good';
              statusMessage = 'Cookies are current';
            } else {
              status = 'stale';
              statusMessage = 'Cookies may be outdated';
            }
          }
          
          this.logDebug('Extension status calculated', { 
            status, 
            cookieCount: cookies.length, 
            isLoggedIn,
            hoursOld: lastUpdated ? (Date.now() - lastUpdated) / (1000 * 60 * 60) : null
          });
          
          return {
            status,
            statusMessage,
            cookieCount: cookies.length,
            lastUpdated,
            lastError,
            isLoggedIn,
            cookies
          };
        } catch (error) {
          this.logDebug('Error getting extension status', error);
          return {
            status: 'error',
            statusMessage: error.message,
            cookieCount: 0,
            lastUpdated: null,
            lastError: error.message,
            isLoggedIn: false,
            cookies: []
          };
        }
    }

    async syncCookiesToWebApp() {
      try {
        this.logDebug('Starting sync to web app...');
        
        const status = await this.getExtensionStatus();
        
        if (status.cookies.length === 0) {
          this.logDebug('No cookies to sync');
          return;
        }
  
        // Try to find active tabs with your web app
        const tabs = await chrome.tabs.query({
          url: ['http://localhost:*/*', 'https://headhunter-agent-playground.vercel.app/*']
        });
  
        this.logDebug('Found web app tabs', { count: tabs.length, urls: tabs.map(t => t.url) });
  
        if (tabs.length === 0) {
          this.logDebug('No web app tabs found - cookies will sync when web app is opened');
          return;
        }
  
        // Send cookies to all matching tabs
        let successCount = 0;
        for (const tab of tabs) {
          try {
            await chrome.tabs.sendMessage(tab.id, {
              type: 'LINKEDIN_COOKIES_UPDATE',
              cookies: status.cookies,
              timestamp: Date.now()
            });
            successCount++;
            this.logDebug('Synced cookies to tab', { tabId: tab.id, url: tab.url });
          } catch (error) {
            this.logDebug('Failed to sync to tab', { tabId: tab.id, error: error.message });
          }
        }
  
        this.logDebug('Sync completed', { 
          successCount, 
          totalTabs: tabs.length,
          cookieCount: status.cookies.length 
        });
        
        return successCount > 0;
      } catch (error) {
        this.logDebug('Error syncing cookies to web app', error);
        throw error;
      }
    }
  
    startPeriodicCookieUpdate() {
      // Update cookies every 30 minutes
      setInterval(() => {
        this.logDebug('Periodic cookie update triggered');
        this.extractLinkedInCookies();
      }, 30 * 60 * 1000);
    }
  
    notifyPopup(type, data) {
      // Try to send message to popup (will fail silently if popup is closed)
      chrome.runtime.sendMessage({ type, data }).catch(() => {
        // Popup is not open, ignore error
      });
    }

    logDebug(message, data = null) {
      const prefix = `[LinkedIn Cookie Extension - Background]`;
      if (data) {
        console.log(`${prefix} ${message}:`, data);
      } else {
        console.log(`${prefix} ${message}`);
      }
    }

    // ... rest of existing methods stay the same ...
}
  
// Initialize the cookie manager
const cookieManager = new LinkedInCookieManager();