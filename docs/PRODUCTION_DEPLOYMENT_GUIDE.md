# Production Deployment Guide - Arbiter Coffee Shop

**Date Created:** February 1, 2026  
**Version:** 1.0  
**Target Environment:** Production (Cloud Hosting)  
**Prerequisites:** Redis installed and tested locally

---

## Overview

This guide covers deploying the Arbiter Coffee Shop system to production, including:

1. Hosting provider selection
2. Laravel backend deployment
3. React frontend deployment
4. Database migration
5. Environment configuration
6. SSL certificate setup
7. Prerender.io activation
8. SEO finalization

**Estimated Time:** 4-8 hours (depending on hosting provider)

---

## Part 1: Choose Hosting Provider

### Option A: DigitalOcean (Recommended for Beginners)

**Pros:**
- Simple interface, good documentation
- Predictable pricing ($24-48/month)
- Managed databases available
- 1-Click Redis installation

**Cons:**
- Manual server management
- Requires basic Linux knowledge

**Recommended Droplet:**
- Plan: Basic Droplet (2GB RAM, 1 CPU, 50GB SSD) - $24/month
- OS: Ubuntu 22.04 LTS
- Location: Singapore (closest to Philippines)
- Add-ons: Managed MySQL database ($15/month) + Managed Redis ($15/month)
- **Total:** ~$54/month

**Signup:** https://www.digitalocean.com/

---

### Option B: Laravel Forge + DigitalOcean (Easiest, Recommended)

**Pros:**
- Zero-downtime deployments
- Automatic SSL certificates (Let's Encrypt)
- Queue management built-in
- Redis pre-configured
- Git integration
- Best for Laravel projects

**Cons:**
- Additional $12/month for Forge subscription
- Still need DigitalOcean server ($24/month)

**Total Cost:** $36/month (Forge $12 + Droplet $24)

**Setup Process:**
1. Sign up for Laravel Forge: https://forge.laravel.com/
2. Connect DigitalOcean account
3. Create server through Forge (automated)
4. Deploy Laravel app with one click
5. Forge handles SSL, Redis, Queue workers automatically

**This is the EASIEST option for Laravel.**

---

### Option C: AWS (Elastic Beanstalk)

**Pros:**
- Scalable, enterprise-grade
- Auto-scaling capabilities
- Global CDN (CloudFront)

**Cons:**
- Complex setup
- Variable pricing (harder to predict)
- Steeper learning curve

**Estimated Cost:** $50-150/month (depending on traffic)

**Recommended Services:**
- EC2 (t3.small): ~$17/month
- RDS MySQL (db.t3.micro): ~$15/month
- ElastiCache Redis (cache.t3.micro): ~$12/month
- CloudFront CDN: ~$10-30/month
- S3 Storage: ~$1-5/month

**Best for:** High-traffic applications needing scalability

---

### Option D: Shared Hosting (NOT RECOMMENDED)

**Why Not:**
- Limited control over server
- No Redis support (usually)
- Difficult to configure Laravel properly
- Poor performance for React SPA
- No queue worker support

**Only consider if budget < $20/month**

---

## Recommendation Matrix

| Your Priority | Best Option | Cost/Month | Difficulty |
|---------------|-------------|------------|------------|
| Ease of Use | Laravel Forge + DO | $36 | ⭐ Easy |
| Low Cost | DigitalOcean Manual | $24 | ⭐⭐ Medium |
| Scalability | AWS Elastic Beanstalk | $50-150 | ⭐⭐⭐ Hard |
| Full Control | Self-managed VPS | $24+ | ⭐⭐⭐ Hard |

**For this project, I recommend: Laravel Forge + DigitalOcean ($36/month)**

---

## Part 2: Laravel Backend Deployment (Using Forge)

### Step 1: Set Up Laravel Forge

1. **Create Forge Account:**
   - Go to https://forge.laravel.com/
   - Sign up (7-day free trial, then $12/month)
   - Connect payment method

2. **Connect DigitalOcean:**
   - In Forge: Settings → Server Providers → DigitalOcean
   - Generate API token from DigitalOcean: https://cloud.digitalocean.com/account/api/tokens
   - Paste token in Forge

3. **Create Server:**
   - Click "Create Server"
   - Provider: DigitalOcean
   - Server Type: App Server
   - Region: Singapore (sgp1)
   - Size: 2GB RAM ($24/month)
   - PHP Version: 8.2
   - Database: MySQL 8.0
   - ✅ Enable Redis
   - ✅ Enable Queue Worker
   - Server Name: arbiter-production
   - Click "Create Server"
   - Wait 5-10 minutes for provisioning

### Step 2: Configure Server

Once server is ready:

1. **Update PHP Settings:**
   - Server → PHP → Update Configuration
   - Increase `upload_max_filesize` to 10M
   - Increase `post_max_size` to 10M
   - Increase `memory_limit` to 256M

2. **Install Composer Dependencies (Automatic):**
   - Forge handles this automatically during deployment

3. **Configure Redis:**
   - Already installed and configured by Forge
   - Default port: 6379
   - Password: Automatically generated (check in .env)

### Step 3: Deploy Laravel Application

1. **Connect Git Repository:**
   - In Forge: Sites → New Site
   - Domain: arbiter.yourdomain.com (or use Forge's temporary domain)
   - Project Type: Laravel
   - Web Directory: `/public`
   - Create Site

2. **Link GitHub Repository:**
   - Site → Apps → GitHub
   - Authorize Forge to access your GitHub
   - Select repository: `yourusername/ArbiterCoffeeShop`
   - Branch: `main` (or `master`)
   - ✅ Install Composer Dependencies
   - ✅ Run Migrations

3. **Set Environment Variables:**
   - Site → Environment
   - Update `.env` with production values:

```env
APP_NAME="Arbiter Coffee Shop"
APP_ENV=production
APP_DEBUG=false
APP_URL=https://arbiter.yourdomain.com

# Database (use Forge-generated credentials)
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=arbiter_production
DB_USERNAME=forge
DB_PASSWORD=GENERATED_PASSWORD_FROM_FORGE

# Cache (Redis)
CACHE_STORE=redis
SESSION_DRIVER=redis
QUEUE_CONNECTION=redis

# Redis (use Forge-generated password)
REDIS_CLIENT=predis
REDIS_HOST=127.0.0.1
REDIS_PASSWORD=GENERATED_REDIS_PASSWORD
REDIS_PORT=6379
REDIS_DATABASE=0
REDIS_CACHE_DB=1

# Prerender.io (your existing token)
PRERENDER_ENABLE=true
PRERENDER_TOKEN=Az8HCXWvMM5ukgm6CGfN
PRERENDER_URL=https://service.prerender.io

# Mail (configure your mail service)
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@arbiter.com
MAIL_FROM_NAME="Arbiter Coffee Shop"

# Sanctum
SANCTUM_STATEFUL_DOMAINS=arbiter.yourdomain.com,yourdomain.com
SESSION_DOMAIN=.yourdomain.com

# CORS
CORS_ALLOWED_ORIGINS=https://arbiter.yourdomain.com
```

4. **Deploy Application:**
   - Click "Deploy Now"
   - Forge will:
     - Pull latest code from GitHub
     - Run `composer install`
     - Run migrations (`php artisan migrate --force`)
     - Clear caches
     - Restart queue workers
     - Restart PHP-FPM

### Step 4: Run Initial Setup Commands

After first deployment:

1. **SSH into Server:**
   - Site → SSH → Copy SSH command
   - Or use Forge's terminal: Site → Terminal

2. **Seed Database (if needed):**
   ```bash
   cd /home/forge/arbiter.yourdomain.com
   php artisan db:seed --force
   ```

3. **Generate App Key (if not set):**
   ```bash
   php artisan key:generate --force
   ```

4. **Link Storage:**
   ```bash
   php artisan storage:link
   ```

5. **Cache Configuration:**
   ```bash
   php artisan config:cache
   php artisan route:cache
   php artisan view:cache
   ```

### Step 5: Set Up SSL Certificate

1. **In Forge:**
   - Site → SSL → Let's Encrypt
   - Click "Obtain Certificate"
   - Wait 30 seconds
   - Certificate automatically installed and renewed every 90 days

2. **Verify HTTPS:**
   - Visit `https://arbiter.yourdomain.com`
   - Should show green padlock

---

## Part 3: React Frontend Deployment

### Option A: Vercel (Easiest for React)

**Pros:**
- Free for personal projects
- Automatic deployments from Git
- Built-in CDN
- Perfect for React apps

**Setup:**

1. **Build React App:**
   ```bash
   cd C:\xampp\htdocs\ArbiterCoffeeShop HUB\frontend
   npm run build
   ```

2. **Sign Up for Vercel:**
   - https://vercel.com/
   - Sign up with GitHub

3. **Deploy:**
   - Click "Add New Project"
   - Import Git Repository
   - Framework Preset: Create React App
   - Build Command: `npm run build`
   - Output Directory: `build`
   - Environment Variables:
     ```
     REACT_APP_API_URL=https://arbiter.yourdomain.com/api
     ```
   - Click "Deploy"

4. **Custom Domain (Optional):**
   - Project → Settings → Domains
   - Add: `arbiter.yourdomain.com`
   - Configure DNS (instructions provided)

**Cost:** Free (Pro: $20/month for advanced features)

---

### Option B: Netlify (Alternative)

**Similar to Vercel:**

1. **Sign up:** https://www.netlify.com/
2. **Connect GitHub repository**
3. **Build settings:**
   - Build command: `npm run build`
   - Publish directory: `build`
   - Environment: `REACT_APP_API_URL=https://arbiter.yourdomain.com/api`
4. **Deploy**

**Cost:** Free (Pro: $19/month)

---

### Option C: Same Server as Backend (AWS S3 + CloudFront)

If using AWS:

1. **Build React App:**
   ```bash
   npm run build
   ```

2. **Upload to S3:**
   ```bash
   aws s3 sync build/ s3://arbiter-frontend --delete
   ```

3. **Configure CloudFront:**
   - Create distribution pointing to S3 bucket
   - Set default root object: `index.html`
   - Configure SSL certificate
   - Set error pages (404 → index.html for React routing)

4. **Update DNS:**
   - Point domain to CloudFront distribution

**Cost:** ~$10-30/month (depending on traffic)

---

## Part 4: Database Migration

### Export Local Database

```bash
cd C:\xampp\htdocs\ArbiterCoffeeShop HUB\backend

# Export database
C:\xampp\mysql\bin\mysqldump.exe -u root arbiter_coffee_shop > database_backup.sql

# Or with specific tables only (recommended for production)
C:\xampp\mysql\bin\mysqldump.exe -u root arbiter_coffee_shop ^
  users roles permissions categories products orders ^
  > production_seed.sql
```

### Import to Production

**Option 1: Using Forge Database:**

1. **Upload SQL File:**
   - Forge → Database → Import
   - Upload `production_seed.sql`
   - Click "Import"

**Option 2: Using SSH:**

```bash
# SSH into server
ssh forge@your-server-ip

# Upload file (from local machine)
scp database_backup.sql forge@your-server-ip:/home/forge/

# Import (on server)
mysql -u forge -p arbiter_production < /home/forge/database_backup.sql
```

**Option 3: Run Migrations + Seeders:**

```bash
cd /home/forge/arbiter.yourdomain.com
php artisan migrate:fresh --force
php artisan db:seed --force
```

---

## Part 5: Final Configuration

### 1. Update Frontend API URL

**File:** `frontend/src/config/api.js`

```javascript
const API_BASE_URL = process.env.REACT_APP_API_URL || 
  (process.env.NODE_ENV === 'production' 
    ? 'https://arbiter.yourdomain.com/api' 
    : 'http://localhost:8000/api');
```

**Rebuild and redeploy:**
```bash
npm run build
# Redeploy to Vercel/Netlify (automatic if Git-connected)
```

### 2. Update CORS Settings

**File:** `backend/config/cors.php`

```php
'allowed_origins' => [
    'https://arbiter.yourdomain.com',  // Your production frontend
],

'supports_credentials' => true,
```

**Redeploy backend:**
```bash
# Commit changes and push to GitHub
# Forge auto-deploys on push
```

### 3. Update Sanctum Configuration

**File:** `backend/config/sanctum.php`

```php
'stateful' => explode(',', env('SANCTUM_STATEFUL_DOMAINS', 
    'localhost,localhost:3000,127.0.0.1,127.0.0.1:8000,::1,arbiter.yourdomain.com'
)),
```

### 4. Update Sitemap URL

**File:** `backend/app/Http/Controllers/SitemapController.php`

```php
$sitemapUrl = env('APP_URL') . '/sitemap.xml';
// In production: https://arbiter.yourdomain.com/sitemap.xml
```

**Or in `backend/public/robots.txt`:**
```txt
Sitemap: https://arbiter.yourdomain.com/sitemap.xml
```

---

## Part 6: Test Production Environment

### Checklist

- [ ] **Frontend loads:** Visit https://arbiter.yourdomain.com
- [ ] **API accessible:** Visit https://arbiter.yourdomain.com/api/v1/products
- [ ] **SSL working:** Green padlock in browser
- [ ] **Login works:** Test admin/barista/customer login
- [ ] **Image uploads work:** Test product image upload
- [ ] **Cache working:** Check Redis with `redis-cli` on server
- [ ] **Queue workers running:** Check Forge → Site → Queue
- [ ] **No errors:** Check logs in Forge → Site → Logs
- [ ] **CORS working:** Test API calls from frontend
- [ ] **Sanctum auth working:** Test authenticated endpoints

### Testing Commands

```bash
# On server (SSH)
cd /home/forge/arbiter.yourdomain.com

# Test Redis connection
php artisan redis:ping

# Test cache
php artisan tinker
>>> Cache::put('test', 'Production works!', 60);
>>> Cache::get('test');

# Check queue workers
php artisan queue:work --once

# Check logs
tail -f storage/logs/laravel.log
```

---

## Part 7: SEO Activation (After Deployment)

Now that production is live, activate SEO features:

### 1. Update Prerender.io

Already configured in `.env`, verify it's working:

```bash
# Test with bot user agent
curl -A "Googlebot" https://arbiter.yourdomain.com/products

# Should return pre-rendered HTML (not React SPA)
```

### 2. Submit Sitemap to Google

1. **Google Search Console:**
   - Go to: https://search.google.com/search-console
   - Add property: `arbiter.yourdomain.com`
   - Verify ownership (DNS or HTML file)
   - Sitemaps → Add sitemap: `https://arbiter.yourdomain.com/sitemap.xml`
   - Wait 24-48 hours for indexing

2. **Bing Webmaster Tools:**
   - Go to: https://www.bing.com/webmasters
   - Add site: `arbiter.yourdomain.com`
   - Submit sitemap: `https://arbiter.yourdomain.com/sitemap.xml`

### 3. Test Open Graph Tags

**Facebook Debugger:**
- URL: https://developers.facebook.com/tools/debug/
- Enter: `https://arbiter.yourdomain.com`
- Click "Scrape Again"
- Verify title, description, image appear correctly

**LinkedIn Post Inspector:**
- URL: https://www.linkedin.com/post-inspector/
- Enter: `https://arbiter.yourdomain.com/products`
- Check preview

### 4. Test Twitter Cards

**Twitter Card Validator:**
- URL: https://cards-dev.twitter.com/validator
- Enter: `https://arbiter.yourdomain.com`
- Verify card preview

### 5. Validate Structured Data

**Google Rich Results Test:**
- URL: https://search.google.com/test/rich-results
- Enter: `https://arbiter.yourdomain.com`
- Check for errors/warnings
- Test product pages: `https://arbiter.yourdomain.com/products/1`

---

## Part 8: Post-Deployment Monitoring

### Set Up Monitoring

1. **Laravel Telescope (Optional):**
   ```bash
   cd /home/forge/arbiter.yourdomain.com
   composer require laravel/telescope
   php artisan telescope:install
   php artisan migrate
   ```
   - Access: `https://arbiter.yourdomain.com/telescope`
   - Monitor requests, queries, cache operations

2. **UptimeRobot (Free):**
   - https://uptimerobot.com/
   - Monitor uptime: Check every 5 minutes
   - Email alerts on downtime

3. **Google Analytics 4:**
   - Install tracking code in React app
   - Track page views, user behavior

### Daily Checks (Week 1)

- [ ] Check error logs: `tail -f storage/logs/laravel.log`
- [ ] Monitor Redis memory: `redis-cli INFO memory`
- [ ] Check queue status: Forge → Queue
- [ ] Review Google Search Console for crawl errors
- [ ] Check SSL certificate expiry (auto-renewed by Forge)

---

## Troubleshooting

### Issue 1: 500 Internal Server Error

**Check:**
```bash
tail -100 storage/logs/laravel.log
```

**Common causes:**
- Missing .env variables
- Database connection failed
- File permissions wrong (should be 755 for folders, 644 for files)

**Fix permissions:**
```bash
cd /home/forge/arbiter.yourdomain.com
chmod -R 755 storage bootstrap/cache
chown -R forge:forge .
```

### Issue 2: CORS Errors

**Symptoms:** "Access-Control-Allow-Origin" error in browser console

**Fix:**
1. Update `backend/config/cors.php` with production frontend URL
2. Verify `.env` has correct `APP_URL`
3. Clear config cache: `php artisan config:clear`
4. Redeploy

### Issue 3: Images Not Displaying

**Cause:** Storage link missing

**Fix:**
```bash
php artisan storage:link
```

**Verify:** `ls -la public/storage` (should be symlink to `storage/app/public`)

### Issue 4: Sanctum Authentication Fails

**Symptoms:** Login works but API returns 401

**Fix:**
1. Check `SANCTUM_STATEFUL_DOMAINS` in `.env`
2. Verify `SESSION_DOMAIN` set correctly
3. Ensure cookies are sent with credentials:
   ```javascript
   // In React API calls
   axios.defaults.withCredentials = true;
   ```

### Issue 5: Queue Workers Not Processing

**Check status:**
```bash
# In Forge
Site → Daemon → Check if "queue:work" is running

# On server
ps aux | grep queue
```

**Restart:**
```bash
php artisan queue:restart
```

---

## Cost Summary

### Laravel Forge + DigitalOcean (Recommended)

| Service | Cost/Month | Notes |
|---------|------------|-------|
| Laravel Forge | $12 | Subscription |
| DigitalOcean Droplet (2GB) | $24 | Server |
| **Subtotal** | **$36** | Backend hosting |
| Vercel (React) | $0 | Free tier |
| **Total** | **$36/month** | All-in cost |

### Additional Costs (Optional)

| Service | Cost/Month | Notes |
|---------|------------|-------|
| Managed Database (DO) | $15 | If need separate DB |
| Managed Redis (DO) | $15 | If need dedicated Redis |
| Domain Name | $1-2 | Annual cost divided |
| Prerender.io | $0-15 | Free for 250 pages |
| **Maximum Total** | **$66-81** | With all add-ons |

---

## Success Criteria

After deployment, verify:

✅ Frontend accessible via HTTPS  
✅ Backend API responding correctly  
✅ SSL certificate valid (green padlock)  
✅ Database migrated successfully  
✅ Redis caching working  
✅ Queue workers processing jobs  
✅ File uploads working  
✅ Authentication working (Sanctum)  
✅ CORS configured correctly  
✅ Logs show no errors  
✅ Sitemap submitted to Google  
✅ Structured data validated  
✅ Open Graph tags working  
✅ Prerender.io active  

---

## Next Steps

1. **Week 1:** Monitor for errors, fix issues
2. **Week 2:** SEO validation (see SEO_VALIDATION_CHECKLIST.md)
3. **Month 1:** Performance optimization based on real traffic
4. **Month 2:** Implement Phase 3 (Accessibility)

---

**Document Status:** Ready for production deployment  
**Recommended Timeline:** 1-2 days (with Laravel Forge)  
**Support:** Laravel Forge has excellent documentation and support
