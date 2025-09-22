#!/bin/bash

# AWS EC2 Setup Script for OASIS Backend
# This script sets up an Ubuntu 22.04 EC2 instance for production deployment
# Run this script as ubuntu user: ./setup-ec2.sh

set -e  # Exit on any error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}=== $1 ===${NC}"
}

print_header "OASIS Backend EC2 Setup Starting..."

# Check if running as ubuntu user
if [[ "$USER" != "ubuntu" ]]; then
    print_error "This script should be run as the ubuntu user"
    exit 1
fi

print_header "System Update and Basic Packages"
sudo apt-get update
sudo apt-get upgrade -y
sudo apt-get install -y \
    curl \
    wget \
    git \
    unzip \
    htop \
    nginx \
    ufw \
    fail2ban \
    certbot \
    python3-certbot-nginx \
    software-properties-common \
    apt-transport-https \
    ca-certificates \
    gnupg \
    lsb-release

print_status "✅ System updated and basic packages installed"

print_header "Installing Docker"
# Remove old Docker versions
sudo apt-get remove -y docker docker-engine docker.io containerd runc || true

# Add Docker's official GPG key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Set up the stable repository
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker Engine
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Add ubuntu user to docker group
sudo usermod -aG docker ubuntu

print_status "✅ Docker installed successfully"

print_header "Installing Docker Compose"
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

print_status "✅ Docker Compose installed successfully"

print_header "Configuring UFW Firewall"
sudo ufw --force reset
sudo ufw default deny incoming
sudo ufw default allow outgoing

# SSH
sudo ufw allow 22/tcp comment 'SSH'

# HTTP and HTTPS
sudo ufw allow 80/tcp comment 'HTTP'
sudo ufw allow 443/tcp comment 'HTTPS'

# Enable firewall
sudo ufw --force enable

print_status "✅ UFW firewall configured"

print_header "Configuring Fail2Ban"
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local

# Create custom jail for nginx
sudo tee /etc/fail2ban/jail.d/nginx.conf > /dev/null <<EOF
[nginx-http-auth]
enabled = true
port = http,https
logpath = /var/log/nginx/error.log

[nginx-limit-req]
enabled = true
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 10

[nginx-botsearch]
enabled = true
port = http,https
logpath = /var/log/nginx/access.log
maxretry = 2
EOF

sudo systemctl enable fail2ban
sudo systemctl start fail2ban

print_status "✅ Fail2Ban configured"

print_header "Creating Application Directory Structure"
sudo mkdir -p /opt/oasis
sudo chown ubuntu:ubuntu /opt/oasis
mkdir -p /opt/oasis/backups
mkdir -p /opt/oasis/logs

print_status "✅ Directory structure created"

print_header "Configuring Log Rotation"
sudo tee /etc/logrotate.d/oasis > /dev/null <<EOF
/opt/oasis/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 ubuntu ubuntu
    postrotate
        docker-compose -f /opt/oasis/docker-compose.production.yml restart nginx > /dev/null 2>&1 || true
    endscript
}
EOF

print_status "✅ Log rotation configured"

print_header "Setting up System Limits"
# Increase file descriptor limits for containers
sudo tee -a /etc/security/limits.conf > /dev/null <<EOF
ubuntu soft nofile 65536
ubuntu hard nofile 65536
root soft nofile 65536
root hard nofile 65536
EOF

print_status "✅ System limits configured"

print_header "Installing Node.js (for frontend build if needed)"
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

print_status "✅ Node.js installed"

print_header "Creating Systemd Service for Auto-start"
sudo tee /etc/systemd/system/oasis.service > /dev/null <<EOF
[Unit]
Description=OASIS Business Simulator
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/oasis
ExecStart=/usr/local/bin/docker-compose -f docker-compose.production.yml up -d
ExecStop=/usr/local/bin/docker-compose -f docker-compose.production.yml down
TimeoutStartSec=0
User=ubuntu
Group=ubuntu

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl enable oasis.service

print_status "✅ Systemd service created"

print_header "Installing Monitoring Tools"
# Install htop, iotop, netstat
sudo apt-get install -y htop iotop net-tools

# Install ctop for Docker container monitoring
sudo wget https://github.com/bcicen/ctop/releases/download/v0.7.7/ctop-0.7.7-linux-amd64 -O /usr/local/bin/ctop
sudo chmod +x /usr/local/bin/ctop

print_status "✅ Monitoring tools installed"

print_header "Setting up Git Configuration"
cd /opt/oasis

# Configure Git with GitHub credentials if needed
print_status "Repository will be cloned with provided credentials"
print_warning "Note: For private repos, you'll need to provide GitHub token or deploy key"

# The actual clone will be done after setup with proper authentication
print_status "✅ Directory prepared for Git deployment"

print_header "Environment File Setup"
print_warning "⚠️  IMPORTANT: The .env file will be copied from local machine after EC2 setup"
print_status "Waiting for environment file to be deployed..."

print_header "Final System Configuration"
# Increase vm.max_map_count for Elasticsearch (if needed in future)
echo 'vm.max_map_count=262144' | sudo tee -a /etc/sysctl.conf

# Reload systemd
sudo systemctl daemon-reload

print_status "✅ System configuration completed"

print_header "Setup completed successfully! 🎉"
echo ""
print_status "Next Steps:"
echo "1. Clone private repository: git clone https://github.com/[your-username]/[repo-name].git /opt/oasis"
echo "2. Copy .env file: scp -i key.pem .env ubuntu@<EC2_IP>:/opt/oasis/backend/.env.production"
echo "3. Run deployment: cd /opt/oasis/backend && ./deploy.sh"
echo "4. Configure SSL: sudo certbot --nginx -d your-domain.com"
echo ""
print_status "Useful commands:"
echo "  - Check Docker: docker --version && docker-compose --version"
echo "  - Monitor containers: ctop"
echo "  - View logs: journalctl -u oasis.service -f"
echo "  - Check firewall: sudo ufw status"
echo ""
print_warning "SECURITY REMINDER:"
echo "  - Change default SSH port (edit /etc/ssh/sshd_config)"
echo "  - Set up SSH key authentication and disable password auth"
echo "  - Configure automatic security updates"
echo "  - Set up monitoring and alerting"

# Show system information
print_header "System Information"
echo "OS: $(lsb_release -d -s)"
echo "Kernel: $(uname -r)"
echo "Memory: $(free -h | grep '^Mem:' | awk '{print $2}')"
echo "Storage: $(df -h / | tail -1 | awk '{print $2}')"
echo "Docker: $(docker --version)"
echo "Docker Compose: $(docker-compose --version)"