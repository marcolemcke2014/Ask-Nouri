#!/usr/bin/env node
// Simple script to display local IP addresses for accessing the dev server from mobile devices

const os = require('os');
const interfaces = os.networkInterfaces();
const port = 3000;

console.log('\n🚀 NutriFlow Development Server');
console.log('===================================');
console.log('🔗 Available on:');
console.log(`   http://localhost:${port}`);

// Get all local IP addresses
let foundAddresses = false;
for (const interfaceName in interfaces) {
  const networkInterface = interfaces[interfaceName];
  
  for (const iface of networkInterface) {
    // Skip internal, non-ipv4 addresses
    if (iface.internal === false && iface.family === 'IPv4') {
      console.log(`   http://${iface.address}:${port}`);
      console.log(`   ☝️ Use the above URL on your mobile device`);
      console.log(`   ⚠️  Your phone must be on the same WiFi network!`);
      foundAddresses = true;
    }
  }
}

if (!foundAddresses) {
  console.log('   No external IP addresses found - can only access via localhost');
}

console.log('\n📱 Mobile Camera Testing:');
console.log(`   http://localhost:${port}/mobile-access.html`);
console.log('===================================\n'); 