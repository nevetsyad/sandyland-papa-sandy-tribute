// Test file to check if SandylandGame class is properly defined
try {
    // Read the simple-game.js file
    const fs = require('fs');
    const content = fs.readFileSync('simple-game.js', 'utf8');
    
    // Check if the class is defined
    if (content.includes('class SandylandGame')) {
        console.log('✅ SandylandGame class found in file');
    } else {
        console.log('❌ SandylandGame class NOT found in file');
    }
    
    // Check for syntax issues by looking for proper class structure
    const classMatch = content.match(/class SandylandGame\s*\{[\s\S]*?\}/);
    if (classMatch) {
        console.log('✅ Class structure looks valid');
        console.log('Class definition length:', classMatch[0].length, 'characters');
    } else {
        console.log('❌ Invalid class structure');
    }
    
    // Check for proper closing brace
    const closingBraces = (content.match(/}/g) || []).length;
    const openingBraces = (content.match(/{/g) || []).length;
    console.log('Opening braces:', openingBraces, 'Closing braces:', closingBraces);
    
    if (openingBraces === closingBraces) {
        console.log('✅ Brace count matches');
    } else {
        console.log('❌ Brace count mismatch - potential syntax issue');
    }
    
} catch (error) {
    console.error('Error checking file:', error.message);
}