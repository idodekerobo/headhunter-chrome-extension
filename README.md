# LinkedIn Cookie Sync Chrome Extension

🚀 **Fully Automatic** LinkedIn cookie extraction and syncing for your headhunting agent.

## Features

- ✨ **Zero-Click Cookie Extraction**: Automatically captures cookies when you visit LinkedIn
- 🔄 **Real-time Updates**: Refreshes cookies every 30 minutes automatically  
- 🎯 **Smart Status Display**: Shows current cookie status and health
- 🚀 **One-Click Sync**: Instantly sync cookies to your web application
- 🔒 **Privacy-First**: All cookies stay local to your browser
- 📱 **Clean UI**: Simple status display with no manual extraction needed

## How It Works

### Automatic Operation
1. **Install Extension** → Immediately starts monitoring LinkedIn
2. **Visit LinkedIn** → Cookies are automatically extracted in background
3. **Open Web App** → Extension is ready to sync cookies
4. **Click "Sync"** → Cookies are instantly sent to your application

### No Manual Steps Required!
- ❌ No "Extract Cookies" button to click
- ❌ No manual cookie copying/pasting  
- ❌ No complex setup process
- ✅ Just install and it works automatically

## Installation

### Development Installation:
1. Download/clone this extension folder
2. Open Chrome → `chrome://extensions/`
3. Enable "Developer mode" (top right toggle)
4. Click "Load unpacked" → Select the `chrome-extension` folder
5. Extension is now active and monitoring LinkedIn automatically

### Usage:
1. **Visit LinkedIn** (extension auto-extracts cookies)
2. **Open your headhunting agent app**
3. **Click extension icon** → **"Sync to Web App"**
4. Done! Your app now has fresh LinkedIn cookies

## Status Indicators

The extension popup shows real-time status:

- 🟢 **Ready to Go!** - Fresh cookies available (< 1 hour old)
- 🟢 **Cookies Available** - Good cookies available (< 24 hours old)  
- 🟡 **Cookies May Be Old** - Cookies are stale (> 24 hours old)
- 🔵 **Please Log Into LinkedIn** - Not logged into LinkedIn
- 🔴 **No Cookies Found** - No valid cookies detected
- 🔴 **Error Occurred** - Something went wrong

## Automatic Features

- **Background Monitoring**: Watches for LinkedIn visits
- **Auto-Extraction**: Captures cookies without user action
- **Periodic Refresh**: Updates cookies every 30 minutes
- **Smart Filtering**: Only captures relevant authentication cookies
- **Error Handling**: Gracefully handles login/logout states

## Privacy & Security

- ✅ **Local Storage Only**: Cookies never leave your browser
- ✅ **No External Servers**: No data sent to third parties
- ✅ **LinkedIn Only**: Only accesses LinkedIn cookies
- ✅ **Minimal Permissions**: Only requests necessary permissions
- ✅ **Open Source**: Full code transparency

## Troubleshooting

### Extension Not Working?
- Make sure you're logged into LinkedIn
- Check that extension is enabled in Chrome
- Try refreshing LinkedIn page

### No Cookies Detected?
- Ensure you're logged into LinkedIn (not just on login page)
- Wait a few seconds after page loads
- Click "Refresh Status" in extension popup

### Sync Not Working?
- Make sure your web app is open in another tab
- Check that web app URL matches supported domains
- Try syncing again after refreshing web app

## Technical Details

### Supported Domains
- `http://localhost:*` (development)
- `https://*.vercel.app` (production)

### Key Cookies Captured
- Authentication cookies (`li_at`, `JSESSIONID`)
- Session cookies (`bcookie`, `bscookie`)
- Analytics cookies (for proper LinkedIn behavior)
- Security cookies (`li_rm`, `liap`)

### Update Frequency
- **On LinkedIn Visit**: Immediate extraction
- **Background**: Every 30 minutes
- **Manual**: Click "Refresh Status"

## Version History

### v1.0.0
- Fully automatic cookie extraction
- Real-time status display
- One-click syncing to web app
- Background monitoring and updates
- Smart error handling and status reporting