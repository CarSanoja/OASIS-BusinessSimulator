# 🚀 OASIS Business Simulator - Deployment Guide

This guide will help you deploy the OASIS application with the frontend on Vercel and backend on AWS EC2.

## Architecture Overview

```
Frontend (Vercel)                    Backend (AWS EC2 t3.xlarge)
oasis.somosquanta.com           →    api.oasis.somosquanta.com
        ↓                                      ↓
    React/Vite App                        Django API
                                               ↓
                                      PostgreSQL + Redis
                                               ↓
                                    Nginx + Let's Encrypt SSL
```

## Prerequisites

- AWS Account with EC2 access
- Vercel account
- Domain access (Hostinger) for DNS configuration
- OpenAI API key
- GitHub repository (already created)

## Part 1: AWS EC2 Backend Deployment

### 1.1 Launch EC2 Instance

1. **Launch EC2 Instance:**
   - **AMI**: Ubuntu 22.04 LTS
   - **Instance Type**: t3.xlarge (4 vCPU, 16 GB RAM)
   - **Storage**: 100 GB SSD (GP3)
   - **Key Pair**: Create or use existing key pair

2. **Configure Security Group:**
   ```bash
   # Inbound Rules:
   - SSH (22) from your IP
   - HTTP (80) from anywhere (0.0.0.0/0)
   - HTTPS (443) from anywhere (0.0.0.0/0)
   ```

3. **Allocate Elastic IP:**
   - Go to EC2 → Elastic IPs → Allocate Elastic IP address
   - Associate it with your instance

### 1.2 Initial EC2 Setup

1. **Connect to your instance:**
   ```bash
   ssh -i your-key.pem ubuntu@YOUR_ELASTIC_IP
   ```

2. **Run the setup script:**
   ```bash
   wget https://raw.githubusercontent.com/CarSanoja/OASIS-BusinessSimulator/main/backend/setup-ec2.sh
   chmod +x setup-ec2.sh
   ./setup-ec2.sh
   ```

   This script will:
   - Update the system
   - Install Docker, Docker Compose, Nginx
   - Configure firewall (UFW)
   - Set up fail2ban security
   - Clone the repository
   - Create directory structure

### 1.3 Configure Environment Variables

1. **Edit the production environment file:**
   ```bash
   cd /opt/oasis/backend
   cp .env.production.example .env.production
   nano .env.production
   ```

2. **Required variables to configure:**
   ```bash
   SECRET_KEY=your-super-secret-key-here-change-this-in-production
   POSTGRES_PASSWORD=your-secure-db-password-here
   OPENAI_API_KEY=your-openai-api-key-here
   SSL_EMAIL=your-email@example.com
   ```

### 1.4 Deploy the Backend

1. **Run the deployment script:**
   ```bash
   cd /opt/oasis/backend
   ./deploy.sh
   ```

2. **Check deployment status:**
   ```bash
   docker-compose -f docker-compose.production.yml ps
   docker-compose -f docker-compose.production.yml logs -f
   ```

### 1.5 Configure SSL Certificate

1. **Install SSL certificate:**
   ```bash
   sudo certbot --nginx -d api.oasis.somosquanta.com
   ```

2. **Set up automatic renewal:**
   ```bash
   sudo crontab -e
   # Add this line:
   0 12 * * * /usr/bin/certbot renew --quiet
   ```

## Part 2: Domain Configuration (Hostinger)

### 2.1 DNS Configuration

Configure these DNS records in your Hostinger control panel:

```
Type    Name              Value                    TTL
A       oasis             [YOUR_ELASTIC_IP]        3600
A       api.oasis         [YOUR_ELASTIC_IP]        3600
CNAME   www.oasis         oasis.somosquanta.com    3600
```

**Step-by-step in Hostinger:**

1. Login to Hostinger control panel
2. Go to **Domains** → **DNS Zone**
3. Select `somosquanta.com`
4. Add the following records:

   **Frontend Record:**
   - **Type:** A
   - **Name:** oasis
   - **Points to:** `[YOUR_ELASTIC_IP]`
   - **TTL:** 3600

   **Backend API Record:**
   - **Type:** A
   - **Name:** api.oasis
   - **Points to:** `[YOUR_ELASTIC_IP]`
   - **TTL:** 3600

   **WWW Redirect:**
   - **Type:** CNAME
   - **Name:** www.oasis
   - **Points to:** oasis.somosquanta.com
   - **TTL:** 3600

5. Save changes and wait for propagation (up to 48 hours, usually 15-30 minutes)

## Part 3: Vercel Frontend Deployment

### 3.1 Install Vercel CLI

```bash
npm install -g vercel
```

### 3.2 Deploy to Vercel

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Deploy to Vercel:**
   ```bash
   vercel login
   vercel --prod
   ```

3. **Configure custom domain:**
   - Go to Vercel Dashboard
   - Select your project
   - Go to **Settings** → **Domains**
   - Add `oasis.somosquanta.com`

### 3.3 Configure Environment Variables in Vercel

In Vercel Dashboard → Settings → Environment Variables:

```
VITE_API_URL = https://api.oasis.somosquanta.com
VITE_APP_NAME = OASIS Business Simulator
```

## Part 4: Testing and Verification

### 4.1 Backend Health Check

```bash
curl https://api.oasis.somosquanta.com/api/health/
```

### 4.2 Frontend Access

Visit `https://oasis.somosquanta.com`

### 4.3 Full Integration Test

1. Register a new user
2. Create a custom simulation
3. Run a simulation chat
4. Check analytics

## Part 5: Monitoring and Maintenance

### 5.1 Monitoring Commands

```bash
# Container status
docker-compose -f docker-compose.production.yml ps

# View logs
docker-compose -f docker-compose.production.yml logs -f [service]

# System monitoring
htop
ctop  # Docker container monitoring
```

### 5.2 Backup Strategy

```bash
# Manual database backup
docker-compose -f docker-compose.production.yml exec postgres pg_dump -U oasis_user oasis_db > backup.sql

# Automated backups (add to cron)
0 2 * * * cd /opt/oasis/backend && docker-compose -f docker-compose.production.yml exec -T postgres pg_dump -U oasis_user oasis_db > backups/backup_$(date +\%Y\%m\%d).sql
```

### 5.3 Updates and Redeploys

```bash
# Update and redeploy
cd /opt/oasis/backend
./deploy.sh
```

## Troubleshooting

### Common Issues

1. **Port 8009 not accessible:**
   - Check UFW: `sudo ufw status`
   - Check Docker: `docker-compose ps`

2. **SSL certificate issues:**
   - Verify DNS propagation: `nslookup api.oasis.somosquanta.com`
   - Check nginx config: `sudo nginx -t`

3. **Database connection issues:**
   - Check PostgreSQL logs: `docker-compose logs postgres`
   - Verify environment variables

4. **Frontend API connection issues:**
   - Check CORS settings in Django
   - Verify API URL in Vercel environment variables

### Useful Commands

```bash
# Restart specific service
docker-compose -f docker-compose.production.yml restart [service]

# View real-time logs
docker-compose -f docker-compose.production.yml logs -f --tail=100

# Execute commands in container
docker-compose -f docker-compose.production.yml exec django bash

# Check SSL certificate
openssl s_client -connect api.oasis.somosquanta.com:443 -servername api.oasis.somosquanta.com
```

## Security Best Practices

1. **Change default SSH port**
2. **Set up SSH key authentication** (disable password auth)
3. **Configure automatic security updates**
4. **Monitor access logs** regularly
5. **Keep Docker images updated**
6. **Use strong passwords** for database
7. **Regularly backup** database and configuration

## Cost Estimation

- **AWS EC2 t3.xlarge**: ~$120/month
- **Elastic IP**: $3.60/month (when associated)
- **EBS Storage (100GB)**: ~$10/month
- **Vercel**: Free (Hobby plan)
- **Total**: ~$134/month

## Support and Maintenance

For ongoing support and maintenance:
- Monitor application logs daily
- Check system resources weekly
- Update Docker images monthly
- Review security logs regularly
- Test backup and restore procedures monthly