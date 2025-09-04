import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function replaceOutdatedFavicons() {
  try {
    console.log('🔄 Replacing all outdated favicon files with AVAI branding...');
    
    const publicDir = path.join(__dirname, '../public');
    const distDir = path.join(__dirname, '../dist');
    
    // Ensure dist directory exists
    if (!fs.existsSync(distDir)) {
      fs.mkdirSync(distDir, { recursive: true });
      console.log('📁 Created dist directory');
    }
    
    // List of favicon files to copy
    const faviconFiles = [
      'favicon.ico',
      'favicon.svg',
      'favicon-16x16.png',
      'favicon-32x32.png',
      'favicon-48x48.png',
      'favicon-64x64.png',
      'favicon-128x128.png',
      'favicon-256x256.png'
    ];
    
    console.log('📋 Copying AVAI favicon files to dist:');
    
    faviconFiles.forEach(file => {
      const srcPath = path.join(publicDir, file);
      const destPath = path.join(distDir, file);
      
      if (fs.existsSync(srcPath)) {
        fs.copyFileSync(srcPath, destPath);
        console.log(`  ✅ ${file}`);
      } else {
        console.log(`  ⚠️  ${file} not found in public directory`);
      }
    });
    
    // Check for any old favicon references in HTML files
    const indexPath = path.join(__dirname, '../index.html');
    if (fs.existsSync(indexPath)) {
      const htmlContent = fs.readFileSync(indexPath, 'utf8');
      console.log('🔍 Checking HTML favicon references...');
      
      const faviconRefs = htmlContent.match(/href="[^"]*favicon[^"]*"/g) || [];
      console.log('📋 Found favicon references in HTML:');
      faviconRefs.forEach(ref => console.log(`  ${ref}`));
    }
    
    // List all files in public directory for verification
    console.log('📂 Current favicon files in public directory:');
    const publicFiles = fs.readdirSync(publicDir)
      .filter(file => file.includes('favicon'))
      .sort();
    
    publicFiles.forEach(file => {
      const filePath = path.join(publicDir, file);
      const stats = fs.statSync(filePath);
      const sizeKB = (stats.size / 1024).toFixed(2);
      console.log(`  📄 ${file} (${sizeKB} KB)`);
    });
    
    console.log('✅ All outdated favicon files have been replaced with AVAI branding!');
    console.log('🚀 Ready for deployment to avai.life');
    
  } catch (error) {
    console.error('❌ Error replacing favicon files:', error);
    process.exit(1);
  }
}

replaceOutdatedFavicons();
