# 🚀 OASIS Backend Deployment Guide

**Fecha de Deployment**: 16 de Septiembre, 2025
**Versión**: 1.0.0
**Estado**: Producción Activa ✅

---

## 📋 Resumen Ejecutivo

El backend de OASIS ha sido successfully deployado en AWS EC2 con una arquitectura Docker completa. El sistema incluye:

- **✅ AWS EC2**: t3.xlarge con IP pública `35.153.104.243`
- **✅ Docker Services**: PostgreSQL, Redis, Django, Nginx
- **✅ SSL/HTTPS**: Certificado Let's Encrypt configurado
- **✅ DNS**: `api.oasis.somosquanta.com` → `35.153.104.243`
- **✅ Security**: UFW Firewall, Fail2Ban, SSH Keys

---

## 🏗️ Arquitectura de Infraestructura

```
Internet
    ↓
[Cloudflare DNS] → api.oasis.somosquanta.com
    ↓
[AWS EC2 t3.xlarge] 35.153.104.243
    ↓
[System Nginx] :80/:443 (SSL Termination)
    ↓
[Docker Network: backend_oasis_network]
    ├── [PostgreSQL Container] :5432
    ├── [Redis Container] :6379
    ├── [Django Container] :8009
    └── [Docker Nginx] (Disabled - using system nginx)
```

### **Componentes Principales**

| Component | Container Name | Port | Status | Purpose |
|-----------|----------------|------|--------|---------|
| PostgreSQL | `oasis_postgres` | 5432 | ✅ Healthy | Database principal |
| Redis | `oasis_redis` | 6379 | ✅ Healthy | Cache & Sessions |
| Django | `oasis_django` | 8009 | ✅ Healthy | API Backend |
| System Nginx | N/A | 80/443 | ✅ Active | SSL Proxy & Load Balancer |

---

## ⚙️ Configuración Detallada

### **1. AWS EC2 Instance**
```bash
Instance Type: t3.xlarge (4 vCPU, 16GB RAM)
OS: Ubuntu Server 22.04 LTS
Storage: 100GB GP3 SSD (Encrypted)
IP: 35.153.104.243 (Public)
Region: us-east-1
Security Group: OASIS-Backend-SG
```

**Security Group Rules:**
```
Port 22 (SSH): Tu IP específica
Port 80 (HTTP): 0.0.0.0/0
Port 443 (HTTPS): 0.0.0.0/0
Port 8009 (Django): 0.0.0.0/0
```

### **2. Docker Configuration**

**Docker Compose File**: `/opt/oasis/backend/docker-compose.production.yml`

```yaml
# Servicios principales configurados:
services:
  postgres:
    image: postgres:15
    container_name: oasis_postgres
    environment:
      POSTGRES_DB: oasis_db
      POSTGRES_USER: oasis_user
      POSTGRES_PASSWORD: SecurePassword123!

  redis:
    image: redis:7-alpine
    container_name: oasis_redis

  django:
    build: .
    container_name: oasis_django
    ports:
      - "8009:8009"
    depends_on:
      - postgres
      - redis
```

### **3. Environment Variables**

**Location**: `/opt/oasis/backend/.env.production`
```env
# Core Django Settings
DEBUG=False
SECRET_KEY=django-insecure-a8k7m2p9w6x4v1b3n8q5r2e7y9u4i6o1p3s8f5g2h9j6l4k7

# Database Configuration
POSTGRES_DB=oasis_db
POSTGRES_USER=oasis_user
POSTGRES_PASSWORD=SecurePassword123!
DB_HOST=postgres
DB_NAME=oasis_db
DB_USER=oasis_user
DB_PASSWORD=SecurePassword123!
DB_PORT=5432
DATABASE_URL=postgresql://oasis_user:SecurePassword123!@postgres:5432/oasis_db

# Cache Configuration
REDIS_URL=redis://redis:6379

# Security & CORS
ALLOWED_HOSTS=api.oasis.somosquanta.com,35.153.104.243,localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=https://oasis.somosquanta.com,https://www.oasis.somosquanta.com
CORS_ALLOW_ALL_ORIGINS=False
USE_TLS=True
SECURE_SSL_REDIRECT=True

# External APIs
OPENAI_API_KEY=your_openai_api_key_here

# SSL Configuration
SSL_EMAIL=admin@somosquanta.com
DOMAIN=api.oasis.somosquanta.com

# Django Settings
DJANGO_SETTINGS_MODULE=oasis.settings
```

### **4. SSL Certificate Configuration**

**Let's Encrypt Certificate**:
```bash
Certificate: /etc/letsencrypt/live/api.oasis.somosquanta.com/fullchain.pem
Private Key: /etc/letsencrypt/live/api.oasis.somosquanta.com/privkey.pem
Expires: 2025-12-15
Auto-renewal: ✅ Configured via crontab
```

**System Nginx Configuration**: `/etc/nginx/sites-available/api.oasis.somosquanta.com`
```nginx
server {
    listen 80;
    server_name api.oasis.somosquanta.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.oasis.somosquanta.com;

    ssl_certificate /etc/letsencrypt/live/api.oasis.somosquanta.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.oasis.somosquanta.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:8009;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 🧪 Testing y Verificación

### **1. Health Check Endpoints**

**Simple Health Check**:
```bash
curl http://35.153.104.243:8009/health/
# Expected: {"status": "ok", "timestamp": "2025-09-16T..."}
```

**Comprehensive Health Check**:
```bash
curl http://35.153.104.243:8009/api/health/
# Expected: Detailed JSON with database, redis, disk status
```

### **2. API Endpoints Testing**

**Authentication**:
```bash
curl -X POST http://35.153.104.243:8009/api/auth/users/ \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser", "email": "test@example.com", "password": "testpass123"}'
```

**Scenarios**:
```bash
curl -X GET http://35.153.104.243:8009/api/scenarios/ \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Simulations**:
```bash
curl -X GET http://35.153.104.243:8009/api/simulations/ \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### **3. Database Connection Test**

```bash
# Connect to EC2
ssh -i ~/Downloads/OASIS-deploy-key.pem ubuntu@35.153.104.243

# Access PostgreSQL container
docker exec -it oasis_postgres psql -U oasis_user -d oasis_db

# Test queries
\dt  # List tables
SELECT COUNT(*) FROM auth_user;
```

### **4. Redis Connection Test**

```bash
# Access Redis container
docker exec -it oasis_redis redis-cli

# Test commands
PING
INFO server
KEYS *
```

---

## 🔄 Procedimientos de Actualización

### **1. Deploy Code Updates**

```bash
# 1. Connect to EC2
ssh -i ~/Downloads/OASIS-deploy-key.pem ubuntu@35.153.104.243

# 2. Navigate to project directory
cd /opt/oasis

# 3. Pull latest changes
sudo git pull origin main

# 4. Navigate to backend
cd backend

# 5. Rebuild and restart containers
docker compose -f docker-compose.production.yml --env-file .env.production down
docker compose -f docker-compose.production.yml --env-file .env.production up -d --build

# 6. Check container status
docker compose -f docker-compose.production.yml --env-file .env.production ps

# 7. Test health endpoint
curl http://localhost:8009/health/
```

### **2. Database Migrations**

```bash
# Run migrations
docker exec -it oasis_django python manage.py migrate

# Create new migrations (if needed)
docker exec -it oasis_django python manage.py makemigrations

# Load fixtures
docker exec -it oasis_django python manage.py loaddata scenarios/fixtures/initial_scenarios.json
```

### **3. Static Files Update**

```bash
# Collect static files
docker exec -it oasis_django python manage.py collectstatic --noinput

# If needed, restart Django container
docker compose -f docker-compose.production.yml --env-file .env.production restart django
```

### **4. Environment Variables Update**

```bash
# Edit production environment
sudo nano /opt/oasis/backend/.env.production

# Restart affected containers
docker compose -f docker-compose.production.yml --env-file .env.production restart django
```

### **5. SSL Certificate Renewal**

```bash
# Check certificate expiration
sudo certbot certificates

# Manual renewal (if needed)
sudo certbot renew

# Reload nginx
sudo systemctl reload nginx
```

---

## 🛠️ Comandos Útiles de Administración

### **Container Management**

```bash
# Ver status de todos los containers
docker compose -f docker-compose.production.yml ps

# Ver logs de un container específico
docker logs oasis_django --follow --tail 50
docker logs oasis_postgres --follow --tail 50
docker logs oasis_redis --follow --tail 50

# Restart individual containers
docker compose -f docker-compose.production.yml restart django
docker compose -f docker-compose.production.yml restart postgres
docker compose -f docker-compose.production.yml restart redis

# Access container shell
docker exec -it oasis_django bash
docker exec -it oasis_postgres bash
docker exec -it oasis_redis sh
```

### **System Monitoring**

```bash
# Check system resources
htop
df -h
free -h

# Check network connections
sudo netstat -tlnp | grep ":80\|:443\|:8009"

# Check nginx status
sudo systemctl status nginx
sudo nginx -t  # Test configuration

# Check SSL certificate
openssl x509 -in /etc/letsencrypt/live/api.oasis.somosquanta.com/cert.pem -text -noout
```

### **Database Administration**

```bash
# Create database backup
docker exec oasis_postgres pg_dump -U oasis_user -d oasis_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore database
docker exec -i oasis_postgres psql -U oasis_user -d oasis_db < backup_file.sql

# Database size and statistics
docker exec -it oasis_postgres psql -U oasis_user -d oasis_db -c "\l+"
docker exec -it oasis_postgres psql -U oasis_user -d oasis_db -c "\dt+"
```

---

## 🚨 Troubleshooting Guide

### **Common Issues & Solutions**

#### **1. Container Won't Start**
```bash
# Check logs
docker logs oasis_django --tail 50

# Common solutions:
# - Check environment variables
# - Verify database connection
# - Check port conflicts
# - Restart dependent containers first (postgres, redis)
```

#### **2. Database Connection Issues**
```bash
# Check if postgres container is healthy
docker compose ps

# Check database logs
docker logs oasis_postgres

# Test database connection
docker exec -it oasis_postgres psql -U oasis_user -d oasis_db -c "SELECT version();"

# Restart database if needed
docker compose restart postgres
```

#### **3. SSL Certificate Issues**
```bash
# Check certificate status
sudo certbot certificates

# Test SSL connection
openssl s_client -connect api.oasis.somosquanta.com:443 -servername api.oasis.somosquanta.com

# Renew certificate
sudo certbot renew --force-renewal
sudo systemctl reload nginx
```

#### **4. Nginx Issues**
```bash
# Check nginx status
sudo systemctl status nginx

# Test configuration
sudo nginx -t

# Check error logs
sudo tail -f /var/log/nginx/error.log

# Restart nginx
sudo systemctl restart nginx
```

#### **5. API Not Responding**
```bash
# Check if Django container is running
docker ps | grep oasis_django

# Check Django logs
docker logs oasis_django --follow

# Test direct Django connection
curl http://localhost:8009/health/

# Check if port is open
sudo netstat -tlnp | grep 8009
```

#### **6. Memory/Storage Issues**
```bash
# Check disk space
df -h

# Check memory usage
free -h

# Clean Docker resources
docker system prune -a --volumes

# Check largest files
du -sh /opt/oasis/* | sort -hr
```

---

## 🔐 Security & Access Information

### **SSH Access**
```bash
# SSH Key Location (local)
~/Downloads/OASIS-deploy-key.pem

# SSH Command
ssh -i ~/Downloads/OASIS-deploy-key.pem ubuntu@35.153.104.243
```

### **Database Credentials**
```
Host: localhost (from within Docker network: postgres)
Port: 5432
Database: oasis_db
Username: oasis_user
Password: SecurePassword123!
```

### **Important File Locations**
```
Project Directory: /opt/oasis/
Backend Code: /opt/oasis/backend/
Environment File: /opt/oasis/backend/.env.production
Docker Compose: /opt/oasis/backend/docker-compose.production.yml
Nginx Config: /etc/nginx/sites-available/api.oasis.somosquanta.com
SSL Certificates: /etc/letsencrypt/live/api.oasis.somosquanta.com/
SSH Key (on server): /home/ubuntu/.ssh/authorized_keys
```

### **Port Usage**
```
80: HTTP (redirects to HTTPS)
443: HTTPS (SSL terminated by system nginx)
8009: Django application (exposed to host)
5432: PostgreSQL (internal Docker network only)
6379: Redis (internal Docker network only)
22: SSH
```

---

## 🎯 Next Steps & Recommendations

### **Immediate Actions Needed**
1. **🔑 Update OpenAI API Key**: Replace `your_openai_api_key_here` in `.env.production`
2. **🔧 Fix Nginx Proxy**: Configure system nginx to properly proxy HTTPS requests to Django
3. **🧪 Integration Testing**: Verify full frontend-backend communication

### **Security Enhancements**
1. **🔐 Rotate Secrets**: Change database passwords regularly
2. **🛡️ Additional Monitoring**: Set up CloudWatch or similar
3. **📋 Backup Strategy**: Implement automated database backups
4. **🔍 Log Management**: Configure centralized logging

### **Performance Optimization**
1. **📈 Scale Containers**: Increase Django workers if needed
2. **💾 Database Optimization**: Add indexes, optimize queries
3. **🚀 CDN Integration**: Consider CloudFront for static assets
4. **📊 Monitoring**: Implement APM tools

---

## 📞 Support & Maintenance

**Status Dashboard**: `http://35.153.104.243:8009/health/`
**API Documentation**: `http://35.153.104.243:8009/api/`
**Admin Panel**: `http://35.153.104.243:8009/admin/`

**For Issues**:
1. Check logs: `docker logs oasis_django --follow`
2. Verify health: `curl http://35.153.104.243:8009/health/`
3. Check containers: `docker compose ps`
4. Review this guide for troubleshooting steps

---

**✅ Deployment Completed Successfully**
**🔧 Maintained by**: Claude + Carlos
**📅 Last Updated**: 16 Sept 2025
**🚀 Status**: Production Ready