/**
 * Test script to find and connect to Ollama server
 * Run this from your computer (where Ollama is running) to find the correct IP
 */

const http = require('http');
const os = require('os');

// Get all network interfaces
function getLocalIPs() {
  const interfaces = os.networkInterfaces();
  const ips = [];
  
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Skip internal (loopback) and non-IPv4 addresses
      if (iface.family === 'IPv4' && !iface.internal) {
        ips.push({
          interface: name,
          address: iface.address,
          netmask: iface.netmask
        });
      }
    }
  }
  
  return ips;
}

// Test if Ollama is accessible at a given URL
async function testOllamaConnection(url) {
  return new Promise((resolve) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 11434,
      path: '/api/tags',
      method: 'GET',
      timeout: 5000,
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const json = JSON.parse(data);
            resolve({ success: true, models: json.models || [] });
          } catch (e) {
            resolve({ success: false, error: 'Invalid JSON response' });
          }
        } else {
          resolve({ success: false, error: `HTTP ${res.statusCode}` });
        }
      });
    });

    req.on('error', (error) => {
      resolve({ success: false, error: error.message });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ success: false, error: 'Timeout after 5 seconds' });
    });

    req.end();
  });
}

async function main() {
  console.log('🔍 Finding Ollama server...\n');
  
  // Get local IPs
  const localIPs = getLocalIPs();
  console.log('📡 Found network interfaces:');
  localIPs.forEach(ip => {
    console.log(`   ${ip.interface}: ${ip.address}`);
  });
  
  console.log('\n🧪 Testing Ollama connections...\n');
  
  // Test common ports
  const ports = [11434, 11345];
  const tested = [];
  
  for (const ip of localIPs) {
    for (const port of ports) {
      const url = `http://${ip.address}:${port}`;
      console.log(`Testing ${url}...`);
      const result = await testOllamaConnection(url);
      
      if (result.success) {
        console.log(`✅ SUCCESS! Ollama is accessible at: ${url}`);
        console.log(`   Available models: ${result.models.length}`);
        if (result.models.length > 0) {
          console.log(`   Models: ${result.models.map(m => m.name).join(', ')}`);
        }
        tested.push({ url, success: true });
      } else {
        console.log(`   ❌ Failed: ${result.error}`);
        tested.push({ url, success: false, error: result.error });
      }
    }
  }
  
  console.log('\n📋 Summary:');
  const successful = tested.filter(t => t.success);
  if (successful.length > 0) {
    console.log('\n✅ Use one of these URLs in your .env file:');
    successful.forEach(t => {
      console.log(`   EXPO_PUBLIC_OLLAMA_BASE_URL=${t.url}`);
    });
  } else {
    console.log('\n❌ No accessible Ollama server found.');
    console.log('\n💡 Troubleshooting:');
    console.log('   1. Make sure Ollama is running: ollama serve');
    console.log('   2. Check if Ollama is listening on the correct port');
    console.log('   3. Check firewall settings');
    console.log('   4. Try accessing http://localhost:11434 in your browser');
  }
}

main().catch(console.error);

