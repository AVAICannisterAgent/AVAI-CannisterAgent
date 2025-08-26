import fs from 'fs';
import { createCanvas, loadImage } from 'canvas';

// Create a 32x32 canvas for the favicon
const canvas = createCanvas(32, 32);
const ctx = canvas.getContext('2d');

// Draw playful doctor favicon
ctx.fillStyle = '#FFE4B5'; // Skin color
ctx.beginPath();
ctx.arc(16, 16, 14, 0, 2 * Math.PI);
ctx.fill();

// Border
ctx.strokeStyle = '#FF6B6B';
ctx.lineWidth = 2;
ctx.stroke();

// Stethoscope
ctx.strokeStyle = '#FF6B6B';
ctx.lineWidth = 2;
ctx.beginPath();
ctx.moveTo(8, 20);
ctx.quadraticCurveTo(8, 18, 10, 18);
ctx.lineTo(22, 18);
ctx.quadraticCurveTo(24, 18, 24, 20);
ctx.stroke();

// Stethoscope earpiece
ctx.fillStyle = '#FF6B6B';
ctx.beginPath();
ctx.arc(24, 20, 2, 0, 2 * Math.PI);
ctx.fill();

// Eyes
ctx.fillStyle = '#333';
ctx.beginPath();
ctx.arc(12, 13, 1.5, 0, 2 * Math.PI);
ctx.fill();
ctx.beginPath();
ctx.arc(20, 13, 1.5, 0, 2 * Math.PI);
ctx.fill();

// Eye sparkles
ctx.fillStyle = 'white';
ctx.beginPath();
ctx.arc(12.5, 12.5, 0.5, 0, 2 * Math.PI);
ctx.fill();
ctx.beginPath();
ctx.arc(20.5, 12.5, 0.5, 0, 2 * Math.PI);
ctx.fill();

// Smile
ctx.strokeStyle = '#333';
ctx.lineWidth = 2;
ctx.beginPath();
ctx.moveTo(11, 19);
ctx.quadraticCurveTo(16, 23, 21, 19);
ctx.stroke();

// Medical cross
ctx.fillStyle = '#FF6B6B';
ctx.fillRect(15, 8, 2, 6);
ctx.fillRect(13, 10, 6, 2);

// Rosy cheeks
ctx.fillStyle = 'rgba(255, 182, 193, 0.6)';
ctx.beginPath();
ctx.arc(9, 16, 2, 0, 2 * Math.PI);
ctx.fill();
ctx.beginPath();
ctx.arc(23, 16, 2, 0, 2 * Math.PI);
ctx.fill();

console.log('Playful doctor favicon created!');
