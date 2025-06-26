#!/usr/bin/env node

const https = require('https');

async function healthCheck() {
  console.log('🔍 Running health check...');
  
  const endpoints = [
    'https://expo.dev', // Test basic connectivity
  ];
  
  for (const url of endpoints) {
    try {
      const startTime = Date.now();
      await checkEndpoint(url);
      const responseTime = Date.now() - startTime;
      console.log(`✅ ${url}: ${responseTime}ms`);
    } catch (error) {
      console.log(`❌ ${url}: ${error.message}`);
    }
  }
}

function checkEndpoint(url) {
  return new Promise((resolve, reject) => {
    const request = https.get(url, { timeout: 5000 }, (res) => {
      if (res.statusCode >= 200 && res.statusCode < 400) {
        resolve();
      } else {
        reject(new Error(`HTTP ${res.statusCode}`));
      }
    });
    
    request.on('error', reject);
    request.on('timeout', () => {
      request.destroy();
      reject(new Error('Timeout'));
    });
  });
}

healthCheck().catch(console.error);
