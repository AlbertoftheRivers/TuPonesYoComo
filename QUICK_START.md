# Quick Start Guide

## Solution: Backend API with VPN Access

Your Ollama server is at `192.168.200.45:11434` (VPN network). Instead of connecting directly from your phone, we use a backend API that runs in a container with VPN access.

## Architecture

```
Phone (No VPN needed) → Backend API (Container with VPN) → Ollama (192.168.200.45:11434)
```

## Quick Setup

### 1. Deploy Backend API

```bash
cd backend

# Create .env file
cat > .env << EOF
PORT=3000
OLLAMA_BASE_URL=http://192.168.200.45:11434
OLLAMA_MODEL=llama3.2:3b
NODE_ENV=production
EOF

# Start container (ensure VPN is active on host)
docker-compose up -d

# Verify it's running
curl http://localhost:3000/health
```

### 2. Configure Mobile App

Update your `.env` file in the project root:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.2:3000
```

**Replace `192.168.1.2` with your computer's IP** (where the container is running).

### 3. Test

```bash
# From your phone's browser, test:
http://192.168.1.2:3000/health

# Should return: {"status":"ok",...}
```

### 4. Run Mobile App

```bash
npm start
```

## Finding Your Computer's IP

**Windows:**
```cmd
ipconfig
```
Look for "IPv4 Address" under your Wi-Fi adapter.

**Mac/Linux:**
```bash
ifconfig
# or
ip addr
```

## Troubleshooting

**Container can't reach Ollama:**
- Ensure VPN is active on the Docker host
- Test: `docker exec tuponesyocomo-api ping 192.168.200.45`

**Phone can't reach API:**
- Check firewall allows port 3000
- Verify both devices on same Wi-Fi
- Test from phone browser: `http://<your-ip>:3000/health`

**API timeout:**
- Normal for LLM - can take 30-120 seconds
- Check Ollama server is responsive

## Files Created

- `backend/server.js` - Express API server
- `backend/Dockerfile` - Container definition
- `backend/docker-compose.yml` - Deployment config
- `DEPLOYMENT.md` - Detailed deployment guide
- `backend/README.md` - API documentation

## Next Steps

1. Deploy backend container
2. Update mobile app `.env` with API URL
3. Test connection
4. Start using the app!

For detailed information, see:
- `DEPLOYMENT.md` - Full deployment guide
- `backend/README.md` - API documentation

