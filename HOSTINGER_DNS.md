# 🌐 HOSTINGER DNS Configuration Guide

This guide provides step-by-step instructions to configure DNS records in Hostinger for the OASIS application.

## Required DNS Records

You need to configure the following DNS records to point your subdomains to your AWS Elastic IP:

```
Domain: somosquanta.com
Frontend: oasis.somosquanta.com → [YOUR_ELASTIC_IP]
Backend API: api.oasis.somosquanta.com → [YOUR_ELASTIC_IP]
```

## Step-by-Step Configuration in Hostinger

### 1. Access Hostinger DNS Zone

1. **Login to Hostinger:**
   - Go to https://www.hostinger.com
   - Click **Login** and enter your credentials

2. **Navigate to DNS Zone:**
   - From the dashboard, go to **Domains**
   - Find `somosquanta.com` and click **Manage**
   - Click on **DNS Zone** tab

### 2. Add DNS Records

#### Record 1: Frontend (oasis subdomain)

1. Click **Add Record** or **Add New Record**
2. Configure the record:
   ```
   Type: A
   Name: oasis
   Points to: [YOUR_ELASTIC_IP]
   TTL: 3600 (or leave default)
   ```
3. Click **Save** or **Add Record**

#### Record 2: Backend API (api.oasis subdomain)

1. Click **Add Record** or **Add New Record**
2. Configure the record:
   ```
   Type: A
   Name: api.oasis
   Points to: [YOUR_ELASTIC_IP]
   TTL: 3600 (or leave default)
   ```
3. Click **Save** or **Add Record**

#### Record 3: WWW Redirect (Optional but recommended)

1. Click **Add Record** or **Add New Record**
2. Configure the record:
   ```
   Type: CNAME
   Name: www.oasis
   Points to: oasis.somosquanta.com
   TTL: 3600 (or leave default)
   ```
3. Click **Save** or **Add Record**

### 3. Verify Configuration

After adding the records, your DNS zone should look like this:

```
Type    Name              Value                          TTL
A       oasis             [YOUR_ELASTIC_IP]              3600
A       api.oasis         [YOUR_ELASTIC_IP]              3600
CNAME   www.oasis         oasis.somosquanta.com          3600
```

## Important Notes

### DNS Propagation Time
- **Local/ISP**: 15-30 minutes (typical)
- **Global**: Up to 48 hours (maximum)
- **Most users**: Changes are visible within 1-2 hours

### IP Address Replacement
Replace `[YOUR_ELASTIC_IP]` with your actual AWS Elastic IP address. For example:
- If your Elastic IP is `54.123.45.67`
- Use `54.123.45.67` in the **Points to** field

### Subdomain Structure
- `oasis.somosquanta.com` → Frontend (Vercel will handle this)
- `api.oasis.somosquanta.com` → Backend (AWS EC2)

## Testing DNS Configuration

### 1. Using Command Line (macOS/Linux)

```bash
# Test frontend domain
nslookup oasis.somosquanta.com

# Test backend API domain
nslookup api.oasis.somosquanta.com

# Test with dig (more detailed)
dig oasis.somosquanta.com
dig api.oasis.somosquanta.com
```

### 2. Using Online Tools

- **DNS Checker**: https://dnschecker.org/
- **WhatsMyDNS**: https://www.whatsmydns.net/

Enter your domain names and verify they resolve to your Elastic IP.

### 3. Browser Testing

Once propagated:
- `http://oasis.somosquanta.com` should show a connection (before Vercel setup)
- `http://api.oasis.somosquanta.com` should show your backend (once deployed)

## Troubleshooting

### Common Issues

#### 1. "Record already exists" error
- Check if a record with the same name already exists
- Delete or modify the existing record instead of creating a new one

#### 2. Changes not visible after hours
- Check if you're testing from the same location (use different devices/networks)
- Use online DNS tools to verify global propagation
- Contact Hostinger support if changes aren't propagating after 24 hours

#### 3. Wrong IP in DNS response
- Verify you entered the correct Elastic IP address
- Check that the Elastic IP is properly associated with your EC2 instance

#### 4. SSL certificate issues later
- Ensure DNS is fully propagated before requesting SSL certificates
- Both domains must resolve correctly for Let's Encrypt to work

### Verification Checklist

Before proceeding with deployment:

- [ ] `oasis.somosquanta.com` resolves to your Elastic IP
- [ ] `api.oasis.somosquanta.com` resolves to your Elastic IP
- [ ] DNS propagation is complete (test from multiple locations)
- [ ] Your EC2 instance is running and accessible via the Elastic IP
- [ ] Security groups allow HTTP (80) and HTTPS (443) traffic

## Advanced Configuration (Optional)

### CAA Records (Certificate Authority Authorization)
If you want to restrict which Certificate Authorities can issue certificates:

```
Type: CAA
Name: oasis
Value: 0 issue "letsencrypt.org"
TTL: 3600
```

### MX Records (if you need email)
If you plan to set up email for the subdomain:

```
Type: MX
Name: oasis
Value: 10 mail.somosquanta.com
TTL: 3600
```

## Contact Support

If you encounter issues with DNS configuration:

- **Hostinger Support**: Available 24/7 through live chat
- **Documentation**: https://support.hostinger.com/en/articles/1583227-how-to-edit-dns-zone-at-hostinger
- **Community**: Hostinger community forums

## Next Steps

After DNS configuration is complete and propagated:

1. **Set up AWS EC2** using the `setup-ec2.sh` script
2. **Deploy the backend** using the `deploy.sh` script
3. **Configure SSL certificates** with Let's Encrypt
4. **Deploy frontend** to Vercel with custom domain
5. **Test the complete application**

The DNS configuration is a critical first step that enables all other deployment steps to work correctly.