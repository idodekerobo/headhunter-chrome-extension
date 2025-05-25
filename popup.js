// Popup script for LinkedIn Cookie Sync Extension
// Shows status and handles syncing - no manual extraction needed

class PopupController {
    constructor() {
      this.initializeElements();
      this.setupEventListeners();
      this.loadStatus();
    }
  
    initializeElements() {
      this.elements = {
        loading: document.getElementById('loading'),
        statusCard: document.getElementById('statusCard'),
        statusIcon: document.getElementById('statusIcon'),
        statusTitle: document.getElementById('statusTitle'),
        statusMessage: document.getElementById('statusMessage'),
        statusDetails: document.getElementById('statusDetails'),
        cookieCount: document.getElementById('cookieCount'),
        lastUpdated: document.getElementById('lastUpdated'),
        syncBtn: document.getElementById('syncBtn'),
        refreshBtn: document.getElementById('refreshBtn')
      };
    }
  
    setupEventListeners() {
      this.elements.syncBtn.addEventListener('click', () => this.syncToWebApp());
      this.elements.refreshBtn.addEventListener('click', () => this.loadStatus());
  
      // Listen for background script messages
      chrome.runtime.onMessage.addListener((message) => {
        if (message.type === 'cookies_updated') {
          this.loadStatus();
        }
      });
    }
  
    async loadStatus() {
      try {
        this.showLoading(true);
        
        const response = await chrome.runtime.sendMessage({ type: 'GET_STATUS' });
        
        if (response.success) {
          this.updateStatusDisplay(response.status);
        } else {
          throw new Error(response.error || 'Failed to get status');
        }
      } catch (error) {
        console.error('Error loading status:', error);
        this.updateStatusDisplay({
          status: 'error',
          statusMessage: 'Failed to load status',
          cookieCount: 0,
          lastUpdated: null,
          isLoggedIn: false
        });
      } finally {
        this.showLoading(false);
      }
    }
  
    updateStatusDisplay(status) {
      const { 
        status: statusType, 
        statusMessage, 
        cookieCount, 
        lastUpdated, 
        isLoggedIn 
      } = status;
  
      // Update status card styling
      this.elements.statusCard.className = `status-card ${this.getStatusClass(statusType)}`;
      
      // Update status icon
      this.elements.statusIcon.className = `status-icon ${this.getStatusClass(statusType)}`;
      this.elements.statusIcon.textContent = this.getStatusIcon(statusType);
      
      // Update status text
      this.elements.statusTitle.textContent = this.getStatusTitle(statusType);
      this.elements.statusMessage.textContent = statusMessage;
      
      // Update details
      this.elements.cookieCount.textContent = cookieCount;
      
      if (lastUpdated) {
        const date = new Date(lastUpdated);
        this.elements.lastUpdated.textContent = this.formatTime(date);
      } else {
        this.elements.lastUpdated.textContent = 'Never';
      }
      
      // Show/hide details
      this.elements.statusDetails.style.display = cookieCount > 0 ? 'block' : 'none';
      
      // Enable/disable sync button
      this.elements.syncBtn.disabled = cookieCount === 0 || statusType === 'error';
      
      // Update sync button text based on status
      if (cookieCount > 0) {
        this.elements.syncBtn.textContent = `Sync Cookies to App`;
      } else {
        this.elements.syncBtn.textContent = 'No Cookies to Sync';
      }
    }
  
    getStatusClass(statusType) {
      switch (statusType) {
        case 'fresh':
        case 'good':
          return 'success';
        case 'stale':
          return 'warning';
        case 'error':
        case 'no_cookies':
          return 'error';
        case 'not_logged_in':
          return 'info';
        default:
          return 'info';
      }
    }
  
    getStatusIcon(statusType) {
      switch (statusType) {
        case 'fresh':
        case 'good':
          return '✓';
        case 'stale':
          return '⚠';
        case 'error':
        case 'no_cookies':
          return '✗';
        case 'not_logged_in':
          return 'i';
        default:
          return '?';
      }
    }
  
    getStatusTitle(statusType) {
      switch (statusType) {
        case 'fresh':
          return 'Ready to Go!';
        case 'good':
          return 'Cookies Available';
        case 'stale':
          return 'Cookies May Be Old';
        case 'error':
          return 'Error Occurred';
        case 'no_cookies':
          return 'No Cookies Found';
        case 'not_logged_in':
          return 'Please Log Into LinkedIn';
        default:
          return 'Checking Status...';
      }
    }
  
    formatTime(date) {
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      
      if (diffMins < 1) {
        return 'Just now';
      } else if (diffMins < 60) {
        return `${diffMins}m ago`;
      } else if (diffHours < 24) {
        return `${diffHours}h ago`;
      } else {
        return date.toLocaleDateString();
      }
    }
  
    async syncToWebApp() {
      try {
        this.showSyncLoading(true);
        
        const response = await chrome.runtime.sendMessage({ type: 'SYNC_TO_WEBAPP' });
        
        if (response.success) {
          this.showSyncSuccess();
        } else {
          throw new Error(response.error || 'Failed to sync cookies');
        }
      } catch (error) {
        console.error('Error syncing to web app:', error);
        this.showSyncError(error.message);
      } finally {
        this.showSyncLoading(false);
      }
    }
  
    showLoading(show) {
      this.elements.loading.classList.toggle('show', show);
      this.elements.statusCard.style.display = show ? 'none' : 'block';
      this.elements.refreshBtn.disabled = show;
    }
  
    showSyncLoading(show) {
      this.elements.syncBtn.disabled = show;
      this.elements.syncBtn.textContent = show ? 'Syncing...' : 'Sync to Web App';
    }
  
    showSyncSuccess() {
      const originalText = this.elements.syncBtn.textContent;
      this.elements.syncBtn.textContent = '✓ Synced!';
      this.elements.syncBtn.style.background = '#22c55e';
      
      setTimeout(() => {
        this.elements.syncBtn.textContent = originalText;
        this.elements.syncBtn.style.background = '';
      }, 2000);
    }
  
    showSyncError(message) {
      const originalText = this.elements.syncBtn.textContent;
      this.elements.syncBtn.textContent = '✗ Failed';
      this.elements.syncBtn.style.background = '#ef4444';
      
      setTimeout(() => {
        this.elements.syncBtn.textContent = originalText;
        this.elements.syncBtn.style.background = '';
      }, 3000);
    }
  }
  
  // Initialize popup when DOM is ready
  document.addEventListener('DOMContentLoaded', () => {
    new PopupController();
});