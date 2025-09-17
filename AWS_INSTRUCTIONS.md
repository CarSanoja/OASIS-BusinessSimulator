# 🚀 AWS EC2 Setup Instructions - Step by Step

## Phase 1: Create EC2 Instance and Elastic IP

### Step 1: Launch EC2 Instance

1. **Login to AWS Console:**
   - Go to https://console.aws.amazon.com/
   - Navigate to EC2 service

2. **Launch Instance:**
   - Click "Launch Instance"
   - **Name**: OASIS-Backend-Production
   - **AMI**: Ubuntu Server 22.04 LTS (Free tier eligible)
   - **Instance Type**: t3.xlarge (4 vCPU, 16 GB RAM)
   - **Key Pair**: Create new or select existing
   - **Network Settings**:
     - VPC: Default VPC
     - Subnet: Default subnet
     - Auto-assign public IP: Enable

3. **Configure Security Group:**
   - Create new security group: "OASIS-Backend-SG"
   - **Inbound Rules:**
     ```
     Type          Port    Source          Description
     SSH           22      Your IP         SSH access
     HTTP          80      0.0.0.0/0       HTTP traffic
     HTTPS         443     0.0.0.0/0       HTTPS traffic
     Custom TCP    8009    0.0.0.0/0       Django API (temporary)
     ```

4. **Storage:**
   - Root volume: 100 GB GP3 SSD
   - Encrypted: Yes (recommended)

5. **Launch the instance**

### Step 2: Allocate Elastic IP

1. **In EC2 Console:**
   - Go to "Network & Security" → "Elastic IPs"
   - Click "Allocate Elastic IP address"
   - **Network Border Group**: Same as your instance region
   - Click "Allocate"

2. **Associate Elastic IP:**
   - Select the newly allocated IP
   - Click "Actions" → "Associate Elastic IP address"
   - **Instance**: Select your OASIS-Backend-Production instance
   - Click "Associate"

3. **Note the Elastic IP:** `Write down this IP address - you'll need it for DNS`

## Phase 2: Configure DNS in Hostinger

**Use the Elastic IP from Step 2 above**

1. **Login to Hostinger:**
   - Go to hPanel → Domains → DNS Zone
   - Select `somosquanta.com`

2. **Add DNS Records:**
   ```
   Type: A
   Name: oasis
   Points to: [YOUR_ELASTIC_IP]
   TTL: 3600

   Type: A
   Name: api.oasis
   Points to: [YOUR_ELASTIC_IP]
   TTL: 3600

   Type: CNAME
   Name: www.oasis
   Points to: oasis.somosquanta.com
   TTL: 3600
   ```

3. **Save changes and wait for propagation (15-30 minutes)**

## Phase 3: Initial EC2 Setup

1. **Connect to your instance:**
   ```bash
   ssh -i your-key.pem ubuntu@[YOUR_ELASTIC_IP]
   ```

2. **Download and run setup script:**
   ```bash
   wget https://raw.githubusercontent.com/CarSanoja/OASIS-BusinessSimulator/main/backend/setup-ec2.sh
   chmod +x setup-ec2.sh
   ./setup-ec2.sh
   ```

## Next Steps Checklist:

- [ ] EC2 instance launched with t3.xlarge
- [ ] Security group configured with ports 22, 80, 443, 8009
- [ ] Elastic IP allocated and associated
- [ ] DNS records added in Hostinger
- [ ] Can SSH into the instance
- [ ] Setup script executed successfully

**Your Elastic IP:** _________________ (fill this in)

Once you complete these steps, let me know and I'll guide you through the backend deployment!