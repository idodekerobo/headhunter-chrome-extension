// Script to create PNG icons for the Chrome extension
// Run this with Node.js to generate actual icon files

const fs = require('fs');
const path = require('path');

// Function to create SVG content
const createSVG = (size) => {
    const borderRadius = Math.max(2, size / 8);
    const fontSize = Math.max(8, size / 3);
    
    return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
    <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#0077b5;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#005885;stop-opacity:1" />
        </linearGradient>
    </defs>
    <rect width="${size}" height="${size}" rx="${borderRadius}" fill="url(#grad)"/>
    <text x="50%" y="50%" text-anchor="middle" dy="0.35em" fill="white" font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="bold">LI</text>
</svg>`;
};

// Function to convert SVG to PNG using Canvas (if available)
const createPNGFromSVG = async (svgContent, size, filename) => {
    try {
        // Try to use canvas (requires canvas package: npm install canvas)
        const { createCanvas } = require('canvas');
        const canvas = createCanvas(size, size);
        const ctx = canvas.getContext('2d');
        
        // Create image from SVG
        const img = new Image();
        const svgBlob = new Blob([svgContent], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(svgBlob);
        
        return new Promise((resolve, reject) => {
            img.onload = () => {
                ctx.drawImage(img, 0, 0, size, size);
                const buffer = canvas.toBuffer('image/png');
                fs.writeFileSync(filename, buffer);
                console.log(`✅ Created ${filename}`);
                resolve();
            };
            img.onerror = reject;
            img.src = url;
        });
    } catch (error) {
        console.log(`⚠️  Canvas not available. Creating SVG file instead: ${filename.replace('.png', '.svg')}`);
        fs.writeFileSync(filename.replace('.png', '.svg'), svgContent);
        return Promise.resolve();
    }
};

// Main function to create all icons
const createIcons = async () => {
    const currentDir = __dirname; // This is already the icons directory
    const sizes = [16, 48, 128];
    
    console.log('🎨 Creating Chrome extension icons...');
    console.log(`📁 Icons directory: ${currentDir}`);
    
    // Create icons for each size
    for (const size of sizes) {
        const svgContent = createSVG(size);
        const filename = path.join(currentDir, `icon${size}.png`);
        
        try {
            await createPNGFromSVG(svgContent, size, filename);
        } catch (error) {
            // Fallback: create SVG files if PNG creation fails
            console.log(`⚠️  PNG creation failed for ${size}x${size}. Creating SVG instead.`);
            const svgFilename = path.join(currentDir, `icon${size}.svg`);
            fs.writeFileSync(svgFilename, svgContent);
            console.log(`✅ Created ${svgFilename}`);
        }
    }
    
    // Create a simple HTML preview file
    const previewHTML = `
<!DOCTYPE html>
<html>
<head>
    <title>Chrome Extension Icons Preview</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5; }
        .icon-preview { display: inline-block; margin: 20px; text-align: center; }
        .icon-preview img { border: 1px solid #ddd; background: white; padding: 10px; }
        .icon-preview svg { border: 1px solid #ddd; background: white; padding: 10px; }
        h1 { color: #0077b5; }
    </style>
</head>
<body>
    <h1>LinkedIn Cookie Sync Extension Icons</h1>
    ${sizes.map(size => `
    <div class="icon-preview">
        <h3>${size}x${size}px</h3>
        ${fs.existsSync(path.join(currentDir, `icon${size}.png`)) 
            ? `<img src="icon${size}.png" alt="${size}x${size} icon">` 
            : createSVG(size)
        }
        <p>icon${size}.${fs.existsSync(path.join(currentDir, `icon${size}.png`)) ? 'png' : 'svg'}</p>
    </div>
    `).join('')}
    
    <h2>Installation Note:</h2>
    <p>If PNG files weren't created automatically, you can:</p>
    <ul>
        <li>Use the SVG files as templates in any image editor</li>
        <li>Convert SVG to PNG using online tools</li>
        <li>Install the 'canvas' package: <code>npm install canvas</code> and run this script again</li>
    </ul>
</body>
</html>`;
    
    fs.writeFileSync(path.join(currentDir, 'preview.html'), previewHTML);
    console.log('✅ Created preview.html - open this file to see your icons');
    
    console.log('\n🎉 Icon creation complete!');
    console.log('\n📋 Next steps:');
    console.log('1. Check the generated icon files in this directory');
    console.log('2. Open preview.html to see how they look');
    console.log('3. If you only have SVG files, convert them to PNG using an image editor');
    console.log('4. Your Chrome extension is ready to use!');
};

// Run the icon creation
createIcons().catch(console.error);