# TuPonesYoComo Backend API

Backend API server that proxies recipe analysis requests to Ollama LLM. Designed to run in a Docker container with VPN access to the Ollama server.

## Architecture

```
Mobile App (Phone) → Backend API (Container with VPN) → Ollama Server (192.168.200.45:11434)
```

- **Mobile App**: Calls the backend API (no VPN needed)
- **Backend API**: Runs in container, has VPN access to Ollama
- **Ollama Server**: Accessible via VPN at `192.168.200.45:11434`

## Setup

### 1. Environment Variables

Create a `.env` file in the `backend/` directory:

```env
PORT=3000
OLLAMA_BASE_URL=http://192.168.200.45:11434
OLLAMA_MODEL=llama3.2:3b
NODE_ENV=production
```

### 2. Run with Docker Compose

```bash
cd backend
docker-compose up -d
```

### 3. Run Manually (for testing)

```bash
cd backend
npm install
npm start
```

### 4. Test the API

```bash
# Health check
curl http://localhost:3000/health

# Analyze recipe
curl -X POST http://localhost:3000/api/analyze-recipe \
  -H "Content-Type: application/json" \
  -d '{
    "rawText": "Chicken with rice and vegetables",
    "mainProtein": "chicken"
  }'
```

## Deployment

### Docker Build

```bash
docker build -t tuponesyocomo-api .
docker run -p 3000:3000 \
  -e OLLAMA_BASE_URL=http://192.168.200.45:11434 \
  -e OLLAMA_MODEL=llama3.2:3b \
  tuponesyocomo-api
```

### Container Network Configuration

For the container to access Ollama via VPN:

1. **If using Docker with VPN on host**:
   - The container should inherit VPN access if the host has VPN
   - Use `network_mode: host` in docker-compose.yml (Linux only)

2. **If using Docker with VPN in container**:
   - Configure VPN client inside the container
   - Or use a VPN-enabled base image

3. **Network routing**:
   - Ensure Docker network can route to `192.168.200.0/24`
   - May need custom Docker network configuration

## API Endpoints

### `GET /health`

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "ollama_url": "http://192.168.200.45:11434",
  "model": "llama3.2:3b"
}
```

### `POST /api/analyze-recipe`

Analyze a recipe using Ollama.

**Request Body:**
```json
{
  "rawText": "Recipe text here...",
  "mainProtein": "chicken"
}
```

**Response:**
```json
{
  "ingredients": [
    {
      "name": "chicken",
      "quantity": 500,
      "unit": "g",
      "notes": null
    }
  ],
  "steps": ["Step 1", "Step 2"],
  "gadgets": ["oven", "pan"],
  "total_time_minutes": 45,
  "oven_time_minutes": 30
}
```

## Troubleshooting

**Container can't reach Ollama:**
- Check VPN is active on host/container
- Verify network routing: `docker exec <container> ping 192.168.200.45`
- Check firewall rules

**API timeout:**
- Ollama server may be slow
- Increase timeout in server.js (currently 120 seconds)

**CORS errors:**
- Ensure CORS is enabled (already configured)
- Check API URL in mobile app matches container URL


Backend API server that proxies recipe analysis requests to Ollama LLM. Designed to run in a Docker container with VPN access to the Ollama server.

## Architecture

```
Mobile App (Phone) → Backend API (Container with VPN) → Ollama Server (192.168.200.45:11434)
```

- **Mobile App**: Calls the backend API (no VPN needed)
- **Backend API**: Runs in container, has VPN access to Ollama
- **Ollama Server**: Accessible via VPN at `192.168.200.45:11434`

## Setup

### 1. Environment Variables

Create a `.env` file in the `backend/` directory:

```env
PORT=3000
OLLAMA_BASE_URL=http://192.168.200.45:11434
OLLAMA_MODEL=llama3.2:3b
NODE_ENV=production
```

### 2. Run with Docker Compose

```bash
cd backend
docker-compose up -d
```

### 3. Run Manually (for testing)

```bash
cd backend
npm install
npm start
```

### 4. Test the API

```bash
# Health check
curl http://localhost:3000/health

# Analyze recipe
curl -X POST http://localhost:3000/api/analyze-recipe \
  -H "Content-Type: application/json" \
  -d '{
    "rawText": "Chicken with rice and vegetables",
    "mainProtein": "chicken"
  }'
```

## Deployment

### Docker Build

```bash
docker build -t tuponesyocomo-api .
docker run -p 3000:3000 \
  -e OLLAMA_BASE_URL=http://192.168.200.45:11434 \
  -e OLLAMA_MODEL=llama3.2:3b \
  tuponesyocomo-api
```

### Container Network Configuration

For the container to access Ollama via VPN:

1. **If using Docker with VPN on host**:
   - The container should inherit VPN access if the host has VPN
   - Use `network_mode: host` in docker-compose.yml (Linux only)

2. **If using Docker with VPN in container**:
   - Configure VPN client inside the container
   - Or use a VPN-enabled base image

3. **Network routing**:
   - Ensure Docker network can route to `192.168.200.0/24`
   - May need custom Docker network configuration

## API Endpoints

### `GET /health`

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "ollama_url": "http://192.168.200.45:11434",
  "model": "llama3.2:3b"
}
```

### `POST /api/analyze-recipe`

Analyze a recipe using Ollama.

**Request Body:**
```json
{
  "rawText": "Recipe text here...",
  "mainProtein": "chicken"
}
```

**Response:**
```json
{
  "ingredients": [
    {
      "name": "chicken",
      "quantity": 500,
      "unit": "g",
      "notes": null
    }
  ],
  "steps": ["Step 1", "Step 2"],
  "gadgets": ["oven", "pan"],
  "total_time_minutes": 45,
  "oven_time_minutes": 30
}
```

## Troubleshooting

**Container can't reach Ollama:**
- Check VPN is active on host/container
- Verify network routing: `docker exec <container> ping 192.168.200.45`
- Check firewall rules

**API timeout:**
- Ollama server may be slow
- Increase timeout in server.js (currently 120 seconds)

**CORS errors:**
- Ensure CORS is enabled (already configured)
- Check API URL in mobile app matches container URL


