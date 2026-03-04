# Deploy backend to Proxmox server via SSH.
# Run from project root: .\scripts\deploy-remote.ps1
# Requires: SSH key auth to server (see docs/SSH-AND-DEPLOY.md)

param(
    [switch]$ShowLogs
)

# --- CONFIGURE THESE FOR YOUR SERVER ---
$ServerHost = "YOUR_SERVER_IP_OR_HOSTNAME"   # e.g. 192.168.1.100 or "tupones" if using ~/.ssh/config
$ServerUser = "YOUR_SSH_USER"                # e.g. root, ubuntu
$RepoPathOnServer = "/path/to/TuPonesYoComo" # Full path to repo on the server

$DeployScript = "scripts/deploy-on-server.sh"

Write-Host "==> Deploying backend to $ServerUser@$ServerHost ($RepoPathOnServer)" -ForegroundColor Cyan
$RemoteCmd = "cd '$RepoPathOnServer' && bash $DeployScript"
if ($ShowLogs) {
    $RemoteCmd += " && cd backend && docker-compose logs -f --tail=50"
}
ssh "${ServerUser}@${ServerHost}" $RemoteCmd
