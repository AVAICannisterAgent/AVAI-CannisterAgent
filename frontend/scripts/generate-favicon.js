import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function generateFavicon() {
  try {
    const svgPath = path.join(__dirname, '../public/favicon.svg');
    const icoPath = path.join(__dirname, '../public/favicon.ico');
    
    console.log('Reading SVG favicon...');
    const svgBuffer = fs.readFileSync(svgPath);
    
    console.log('Converting SVG to ICO format...');
    
    // Generate multiple sizes for the ICO file (16x16, 32x32, 48x48)
    const sizes = [16, 32, 48];
    const pngBuffers = [];
    
    for (const size of sizes) {
      console.log(`Generating ${size}x${size} PNG...`);
      const pngBuffer = await sharp(svgBuffer)
        .resize(size, size)
        .png()
        .toBuffer();
      pngBuffers.push(pngBuffer);
    }
    
    // For now, we'll use the 32x32 version as the main favicon.ico
    // In a full implementation, you'd combine all sizes into a proper ICO file
    const mainIconBuffer = await sharp(svgBuffer)
      .resize(32, 32)
      .png()
      .toBuffer();
    
    // Save as ICO (note: this creates a PNG-based ICO, which is supported by modern browsers)
    fs.writeFileSync(icoPath, mainIconBuffer);
    
    console.log('✅ Favicon.ico generated successfully!');
    console.log(`📁 Saved to: ${icoPath}`);
    
    // Also generate additional PNG sizes for better browser support
    for (const size of [16, 32, 48, 64, 128, 256]) {
      const pngPath = path.join(__dirname, `../public/favicon-${size}x${size}.png`);
      await sharp(svgBuffer)
        .resize(size, size)
        .png()
        .toFile(pngPath);
      console.log(`📁 Generated: favicon-${size}x${size}.png`);
    }
    
  } catch (error) {
    console.error('❌ Error generating favicon:', error);
    process.exit(1);
  }
}

generateFavicon();
