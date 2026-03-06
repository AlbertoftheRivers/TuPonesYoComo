# Automate backend deploy on every GitHub push

When you push backend changes to `main`, the Proxmox server will **automatically** pull the code and restart the API. No PuTTY, no manual commands.

---

## What you need

- Your Proxmox server must be **reachable via SSH from the internet** (public IP with port 22 open, or port 22 forwarded to the server).  
  If it isn’t, see [Server not reachable from the internet](#server-not-reachable-from-the-internet) at the end.

---

## Step 1: Push the project to GitHub (so the server can get the script)

The deploy script and the GitHub Action live in the repo. You need them on GitHub first.

1. **Commit and push** everything (including `scripts/deploy-on-server.sh` and `.github/workflows/deploy-backend.yml`):

   ```bash
   git add scripts/ .github/
   git status
   git commit -m "Add deploy script and GitHub Action"
   git push origin main
   ```

2. **On the server** — make sure the repo is there. If you haven’t cloned it yet:

   ```bash
   # Example: clone into /opt (adjust path and repo URL to yours)
   sudo git clone https://github.com/YOUR_USER/TuPonesYoComo.git /opt/TuPonesYoComo
   ```

   If the repo is already on the server, just pull so it has the new script:

   ```bash
   cd /path/to/TuPonesYoComo
   git pull origin main
   ```

After this, `scripts/deploy-on-server.sh` exists on the server and you can continue with the steps below.

---

## Step 2: Create a deploy SSH key (on your PC)

Open **PowerShell** and run:

```powershell
ssh-keygen -t ed25519 -f $env:USERPROFILE\.ssh\deploy_tupones -N '""'
```

Press Enter. This creates two files:

- `deploy_tupones` (private key) — you’ll put this in GitHub Secrets.
- `deploy_tupones.pub` (public key) — you’ll add this to the server next.

---

## Step 3: Add the public key to the server

The server must accept logins with this key. Use **one** of these:

**Option A — You can already SSH into the server (e.g. with PuTTY or password):**

```powershell
Get-Content $env:USERPROFILE\.ssh\deploy_tupones.pub | ssh YOUR_USER@YOUR_SERVER_IP "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys"
```

Replace `YOUR_USER` and `YOUR_SERVER_IP` with your SSH user and server IP/hostname. Enter your password when asked.

**Option B — You use PuTTY and don’t have OpenSSH:**  
In PuTTY, log in to the server. Then run:

```bash
mkdir -p ~/.ssh
echo "PASTE_THE_CONTENTS_OF_deploy_tupones.pub_HERE" >> ~/.ssh/authorized_keys
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
```

Paste the **entire** line from `deploy_tupones.pub` (starts with `ssh-ed25519`).

---

## Step 4: Make the deploy script executable (on the server)

SSH into the server (PuTTY or PowerShell: `ssh YOUR_USER@YOUR_SERVER_IP`). Then:

```bash
cd /path/to/TuPonesYoComo
chmod +x scripts/deploy-on-server.sh
```

Use the **real path** where the repo lives on the server (e.g. `/opt/TuPonesYoComo` or `/home/ubuntu/TuPonesYoComo`). The script is only there after you’ve pushed the repo and cloned/pulled on the server (Step 1).

---

## Step 5: Add the four GitHub Secrets

1. Open your repo on GitHub.
2. Go to **Settings** → **Secrets and variables** → **Actions**.
3. Click **New repository secret** and add these **four** secrets (exact names):

| Name                  | Value |
|-----------------------|--------|
| `DEPLOY_SSH_KEY`      | Open `C:\Users\YOUR_WINDOWS_USER\.ssh\deploy_tupones` in Notepad. Copy **the whole file** (including `-----BEGIN OPENSSH PRIVATE KEY-----` and `-----END OPENSSH PRIVATE KEY-----`). Paste as the secret value. |
| `DEPLOY_HOST`         | Your server IP or hostname (e.g. `192.168.1.100` or `myserver.example.com`). Must be reachable from the internet on port 22. |
| `DEPLOY_USER`         | The SSH user you use to log in (e.g. `root`, `ubuntu`). |
| `REPO_PATH_ON_SERVER` | Full path to the repo on the server (e.g. `/opt/TuPonesYoComo`). Same path you used in Step 4. |

---

## Step 6: Push and check

1. Make a small change in the backend (e.g. in `backend/server.js`), commit, and push to `main`:

   ```bash
   git add backend/server.js
   git commit -m "test deploy"
   git push origin main
   ```

2. On GitHub, open the **Actions** tab. You should see a run for **Deploy backend**. Click it to see the log.

3. If it succeeds, the server has pulled the latest code and restarted the API. No other steps needed.

From now on, **every push to `main` that changes something under `backend/`** will trigger an automatic deploy.

---

## Summary checklist

- [ ] Pushed repo to GitHub (including `scripts/deploy-on-server.sh` and `.github/workflows/deploy-backend.yml`). Server has repo cloned or pulled (Step 1).
- [ ] Created `deploy_tupones` key pair on your PC (Step 2).
- [ ] Added `deploy_tupones.pub` to server `~/.ssh/authorized_keys` (Step 3).
- [ ] Ran `chmod +x scripts/deploy-on-server.sh` on the server (Step 4).
- [ ] Added all four GitHub Secrets: `DEPLOY_SSH_KEY`, `DEPLOY_HOST`, `DEPLOY_USER`, `REPO_PATH_ON_SERVER` (Step 5).
- [ ] Pushed to `main` and checked the Actions tab (Step 6).

---

## Server not reachable from the internet

If the Action fails with **Connection timed out** or **port 22: Connection timed out**, GitHub’s runners cannot reach your server (no public IP, or port 22 not forwarded). Use one of the options below.

- **Option A — Self-hosted runner (automatic deploy, no SSH from internet)**  
  Install a [GitHub Actions self-hosted runner](https://docs.github.com/en/actions/hosting-your-own-runners/managing-self-hosted-runners) on your Proxmox server. The workflow runs on the server and pulls + restarts there. Use the workflow **Deploy backend (self-hosted)** — see [Setup self-hosted runner](#setup-self-hosted-runner) below.

- **Option B — Manual deploy after push**  
  After each push, run from your PC (in the project folder):  
  `.\scripts\deploy-remote.ps1`  
  Configure `scripts/deploy-remote.ps1` with your server host, user, and repo path. Your PC must be able to SSH to the server (e.g. same LAN or VPN).

### Setup self-hosted runner (Option A)

1. **On the server** (SSH or PuTTY), install a self-hosted runner:  
   - Open your repo on GitHub → **Settings** → **Actions** → **Runners** → **New self-hosted runner**.
   - Pick the OS (Linux) and architecture (e.g. x64). GitHub will show commands to download, configure, and run the runner. Run those **on your Proxmox server** (in a terminal or over SSH).
   - When configuring, choose to run the runner as a **service** so it keeps running after you disconnect.
   - The **runner must run as a user that can run `git` and `docker`** in the repo directory. If you run the runner as `root`, that’s fine. If you use another user, add it to the docker group: `sudo usermod -aG docker YOUR_RUNNER_USER`, then log out and back in.

   **Exact commands to run on the server (Linux):**

   ```bash
   # 1. Create folder and download
   mkdir -p ~/actions-runner && cd ~/actions-runner
   curl -o actions-runner-linux-x64-2.332.0.tar.gz -L https://github.com/actions/runner/releases/download/v2.332.0/actions-runner-linux-x64-2.332.0.tar.gz
   tar xzf actions-runner-linux-x64-2.332.0.tar.gz

   # 2. Configure — USE A FRESH TOKEN from GitHub (Settings → Actions → Runners → New self-hosted runner).
   #    The token expires in a few minutes; if config.sh says "Invalid token", get a new one and run this again.
   ./config.sh --url https://github.com/AlbertoftheRivers/TuPonesYoComo --token YOUR_TOKEN_HERE

   # 3a. Run once in foreground (for testing; stops when you close the terminal)
   ./run.sh
   ```

   To have the runner **keep running after you disconnect**, use the service instead of `./run.sh`:

   ```bash
   # 3b. Install and start as a service (recommended)
   sudo ./svc.sh install
   sudo ./svc.sh start
   # Check status:
   sudo ./svc.sh status
   ```

   If you get **"Invalid token"** or **"Credentials could not be updated"**: the token expired. Go to **Settings** → **Actions** → **Runners** → **New self-hosted runner**, copy the new token, and run `./config.sh --url https://github.com/AlbertoftheRivers/TuPonesYoComo --token NEW_TOKEN` again (then `sudo ./svc.sh start` if you use the service).

2. **Repo secret**  
   In the repo: **Settings** → **Secrets and variables** → **Actions** → **New repository secret**.  
   - Name: `REPO_PATH_ON_SERVER`  
   - Value: the **exact** path where the repo is on the server (e.g. `/opt/TuPonesYoComo` or `/home/ubuntu/TuPonesYoComo`).  
   (If you already added this for the SSH workflow, you’re set.)

3. **Make the deploy script executable** on the server (SSH in and run):
   ```bash
   chmod +x /path/to/TuPonesYoComo/scripts/deploy-on-server.sh
   ```
   Use the same path as in step 2.

4. Push a backend change to `main`. In the **Actions** tab you should see **Deploy backend (self-hosted)** run on your server; it will pull and restart the API.

5. *(Optional)* To avoid the other workflow failing with "Connection timed out", the repo has the SSH-based workflow disabled (see below). If you re-enabled it, you can disable it again by renaming `.github/workflows/deploy-backend.yml` to e.g. `deploy-backend.yml.disabled`.

---

## Troubleshooting

| Problem | What to do |
|--------|-------------|
| Action fails with **Permission denied (publickey)** | Check that the **public** key (`deploy_tupones.pub`) is in the server’s `~/.ssh/authorized_keys` and that `DEPLOY_SSH_KEY` contains the **full private** key (both BEGIN/END lines). |
| Action fails with **Host key verification** | The workflow uses `ssh-keyscan` and `StrictHostKeyChecking=accept-new`. If your network blocks this, you may need to add the server’s host key to a known_hosts secret. |
| **Repo path** / **No such file** on server | Ensure `REPO_PATH_ON_SERVER` is the exact path where the repo is cloned (e.g. `/opt/TuPonesYoComo`). SSH to the server and run `pwd` inside the repo to confirm. |
| **Docker permission denied** on server | Add your SSH user to the docker group: `sudo usermod -aG docker $USER`, then log out and back in. |
| **Connection timed out** / **port 22: Connection timed out** | GitHub cannot reach your server from the internet. Your server is behind a firewall/NAT or has no port 22 open. Use [Server not reachable from the internet](#server-not-reachable-from-the-internet) below (self-hosted runner or manual deploy script). |
