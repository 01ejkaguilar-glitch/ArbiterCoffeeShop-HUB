# Redis Installation Guide for Windows (XAMPP Environment)

**Date Created:** February 1, 2026  
**Environment:** Windows 10/11 with XAMPP  
**Laravel Version:** 12.39.0  
**PHP Version:** 8.2.12

---

## Why Redis?

Redis provides significant advantages over database caching:

- **Cache Tags:** Granular invalidation (clear only products, not everything)
- **Performance:** 10-100x faster than database cache
- **Memory Efficiency:** Automatic memory management and eviction policies
- **Production Ready:** Industry standard for Laravel caching

**Current Issue:** Database cache doesn't support `Cache::tags()`, forcing us to use `Cache::flush()` which clears ALL cache.

---

## Step 1: Download Redis for Windows

### Option A: Official Microsoft Port (Recommended)

1. **Download Redis 5.0.14 (Latest Stable for Windows)**
   - URL: https://github.com/microsoftarchive/redis/releases/tag/win-5.0.14.1
   - File: `Redis-x64-5.0.14.1.msi` (2.9 MB)
   - SHA256: Available on release page

2. **Alternative: Memurai (Commercial, Free for Development)**
   - URL: https://www.memurai.com/get-memurai
   - Native Windows port with better performance
   - Free developer edition available
   - Recommended for production on Windows

### Option B: WSL (Windows Subsystem for Linux)

If you prefer Linux version (more stable, latest features):

```powershell
# Install WSL2 (if not already installed)
wsl --install

# Update WSL
wsl --update

# Install Redis in Ubuntu
wsl
sudo apt update
sudo apt install redis-server -y
sudo service redis-server start
```

**Note:** For XAMPP integration, Option A (native Windows) is simpler.

---

## Step 2: Install Redis as Windows Service

### Using MSI Installer (Easiest)

1. **Run the MSI Installer**
   - Double-click `Redis-x64-5.0.14.1.msi`
   - Click "Next" through the wizard
   - **IMPORTANT:** Check "Add Redis to PATH"
   - **IMPORTANT:** Check "Install as Windows Service"
   - Default port: `6379` (keep default)
   - Installation path: `C:\Program Files\Redis\` (keep default)

2. **Verify Installation**
   - Open PowerShell as Administrator
   - Run:
     ```powershell
     redis-cli --version
     ```
   - Expected output: `redis-cli 5.0.14`

3. **Check Service Status**
   ```powershell
   Get-Service -Name Redis
   ```
   - Expected output:
     ```
     Status   Name               DisplayName
     ------   ----               -----------
     Running  Redis              Redis
     ```

4. **Test Connection**
   ```powershell
   redis-cli
   ```
   - You should see:
     ```
     127.0.0.1:6379>
     ```
   - Type `PING` and press Enter
   - Expected response: `PONG`
   - Type `exit` to quit

---

## Step 3: Configure Redis (Optional)

### Basic Configuration

Redis config file location: `C:\Program Files\Redis\redis.windows.conf`

**Recommended Settings for Development:**

```conf
# Max memory (256MB is sufficient for development)
maxmemory 268435456

# Eviction policy (remove least recently used keys when max memory reached)
maxmemory-policy allkeys-lru

# Persistence (save to disk)
save 900 1       # Save after 900 seconds if at least 1 key changed
save 300 10      # Save after 300 seconds if at least 10 keys changed
save 60 10000    # Save after 60 seconds if at least 10000 keys changed

# Log level
loglevel notice

# Log file location
logfile "C:/Program Files/Redis/redis.log"
```

**After editing config:**
```powershell
# Restart Redis service
Restart-Service Redis
```

---

## Step 4: Configure Laravel to Use Redis

### 4.1 Verify Predis Package

Predis is already in your composer.json:

```bash
cd C:\xampp\htdocs\ArbiterCoffeeShop HUB\backend
C:\xampp\php\php.exe C:\xampp\php\composer.phar show predis/predis
```

Expected output: `predis/predis v2.2.2`

### 4.2 Update .env File

**File:** `backend/.env`

**Change from:**
```env
CACHE_STORE=database
```

**Change to:**
```env
CACHE_STORE=redis
REDIS_CLIENT=predis
REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379
REDIS_DATABASE=0
REDIS_CACHE_DB=1
```

**Explanation:**
- `CACHE_STORE=redis` - Use Redis for caching
- `REDIS_CLIENT=predis` - Use Predis library (already installed)
- `REDIS_DATABASE=0` - Default database for general use
- `REDIS_CACHE_DB=1` - Separate database for cache (good practice)

### 4.3 Clear Config Cache

```bash
cd C:\xampp\htdocs\ArbiterCoffeeShop HUB\backend
C:\xampp\php\php.exe artisan config:clear
C:\xampp\php\php.exe artisan cache:clear
```

### 4.4 Test Redis Connection

```bash
C:\xampp\php\php.exe artisan tinker
```

In Tinker:
```php
Cache::put('test', 'Hello Redis!', 60);
Cache::get('test');
// Should output: "Hello Redis!"

Cache::forget('test');
exit
```

---

## Step 5: Restore Cache Tagging in Controllers

### ProductController Changes

**File:** `backend/app/Http/Controllers/Api/V1/ProductController.php`

**Restore 3 locations:**

1. **Line 34 (getProducts method):**
   ```php
   // Change FROM:
   $products = Cache::remember('products.all', 300, function () use ($validated) {
   
   // Change TO:
   $products = Cache::tags([self::CACHE_TAG])->remember('products.all', 300, function () use ($validated) {
   ```

2. **Line 22 (invalidateCache method):**
   ```php
   // Change FROM:
   Cache::flush();
   
   // Change TO:
   Cache::tags([self::CACHE_TAG])->flush();
   ```

3. **Line 125 (getCoffeeProducts method):**
   ```php
   // Change FROM:
   $products = Cache::remember('products.coffee', 600, function () {
   
   // Change TO:
   $products = Cache::tags([self::CACHE_TAG])->remember('products.coffee', 600, function () {
   ```

### CategoryController Changes

**File:** `backend/app/Http/Controllers/Api/V1/CategoryController.php`

**Restore 3 locations:**

1. **Line 33 (index method):**
   ```php
   // Change FROM:
   $categories = Cache::remember('categories.all', 600, function () {
   
   // Change TO:
   $categories = Cache::tags([self::CACHE_TAG])->remember('categories.all', 600, function () {
   ```

2. **Line 22 (invalidateCache method):**
   ```php
   // Change FROM:
   Cache::flush();
   
   // Change TO:
   Cache::tags([self::CACHE_TAG])->flush();
   ```

3. **Line 88 (getProductsByCategory method):**
   ```php
   // Change FROM:
   return Cache::remember("categories.products.{$id}", 600, function () use ($category) {
   
   // Change TO:
   return Cache::tags([self::CACHE_TAG])->remember("categories.products.{$id}", 600, function () use ($category) {
   ```

---

## Step 6: Test Cache Performance

### Test 1: Basic Cache Operations

```bash
cd C:\xampp\htdocs\ArbiterCoffeeShop HUB\backend
C:\xampp\php\php.exe artisan tinker
```

```php
// Test cache tags
Cache::tags(['products'])->put('test', 'Tagged cache', 60);
Cache::tags(['products'])->get('test'); // "Tagged cache"

// Flush only products tag
Cache::tags(['products'])->flush();
Cache::tags(['products'])->get('test'); // null (flushed)

exit
```

### Test 2: API Endpoint Testing

1. **Start Laravel Server:**
   ```bash
   cd C:\xampp\htdocs\ArbiterCoffeeShop HUB\backend
   C:\xampp\php\php.exe artisan serve
   ```

2. **Test Products Endpoint:**
   ```bash
   # First request (cache miss, should be slower)
   Measure-Command { Invoke-WebRequest http://localhost:8000/api/v1/products?limit=10 }
   
   # Second request (cache hit, should be faster)
   Measure-Command { Invoke-WebRequest http://localhost:8000/api/v1/products?limit=10 }
   ```

3. **Verify Cache in Redis:**
   ```bash
   redis-cli
   KEYS *products*
   # Should show: "laravel_cache_tags:products:..."
   
   TTL laravel_cache_tags:products:entries
   # Should show remaining seconds (~300)
   
   exit
   ```

### Test 3: Cache Invalidation

1. **Check current cache:**
   ```bash
   redis-cli
   KEYS *
   ```

2. **Make a change (create/update product via API or admin panel)**

3. **Verify cache was cleared:**
   ```bash
   redis-cli
   KEYS *products*
   # Should show empty or new cache keys
   ```

---

## Step 7: Performance Monitoring

### Redis CLI Monitoring

```bash
# Real-time monitoring
redis-cli
MONITOR
# Now make API requests, you'll see Redis operations in real-time

# Check memory usage
INFO memory

# Check statistics
INFO stats
```

### Laravel Logging

Add to `backend/app/Http/Controllers/Api/V1/ProductController.php`:

```php
use Illuminate\Support\Facades\Log;

// In getProducts method, after cache retrieval:
Log::info('Products cache', [
    'cache_key' => 'products.all',
    'cache_hit' => Cache::tags([self::CACHE_TAG])->has('products.all'),
    'execution_time' => microtime(true) - LARAVEL_START
]);
```

Check logs:
```bash
Get-Content backend/storage/logs/laravel.log -Tail 20
```

---

## Troubleshooting

### Issue 1: Redis Service Won't Start

**Solution:**
```powershell
# Check if port 6379 is in use
netstat -ano | findstr :6379

# If blocked, kill the process or change Redis port in redis.windows.conf:
# port 6380

# Restart service
Restart-Service Redis
```

### Issue 2: Connection Refused

**Check .env settings:**
```env
REDIS_HOST=127.0.0.1  # Not 'localhost'
REDIS_PORT=6379       # Match Redis config
```

**Test connection:**
```bash
C:\xampp\php\php.exe artisan redis:ping
```

### Issue 3: Predis Not Found

```bash
cd C:\xampp\htdocs\ArbiterCoffeeShop HUB\backend
C:\xampp\php\php.exe C:\xampp\php\composer.phar require predis/predis
```

### Issue 4: Cache Tags Not Working

**Error:** `This cache store does not support tagging`

**Cause:** .env still has `CACHE_STORE=database`

**Solution:**
```bash
# Update .env
CACHE_STORE=redis

# Clear config cache
C:\xampp\php\php.exe artisan config:clear
C:\xampp\php\php.exe artisan cache:clear
```

---

## Production Recommendations

### Security

1. **Set Redis Password:**
   ```conf
   # In redis.windows.conf
   requirepass YourStrongPasswordHere
   ```

   ```env
   # In .env
   REDIS_PASSWORD=YourStrongPasswordHere
   ```

2. **Bind to Localhost Only:**
   ```conf
   # In redis.windows.conf
   bind 127.0.0.1
   ```

3. **Disable Dangerous Commands:**
   ```conf
   rename-command FLUSHDB ""
   rename-command FLUSHALL ""
   rename-command CONFIG ""
   ```

### Performance

1. **Increase Max Memory (Production):**
   ```conf
   maxmemory 1gb  # Adjust based on server RAM
   ```

2. **Enable Persistence:**
   ```conf
   # RDB snapshots
   save 900 1
   save 300 10
   save 60 10000
   
   # AOF (Append Only File) for better durability
   appendonly yes
   appendfsync everysec
   ```

3. **Monitor Performance:**
   - Install Redis Desktop Manager: https://resp.app/
   - Or use RedisInsight: https://redis.io/insight/

---

## Success Criteria

✅ Redis service running on port 6379  
✅ `redis-cli PING` returns `PONG`  
✅ Laravel connects to Redis (artisan tinker test passes)  
✅ Cache tags working in ProductController and CategoryController  
✅ API response time < 200ms for cached endpoints  
✅ Cache invalidation only clears relevant tags (not all cache)  
✅ No errors in `storage/logs/laravel.log`

---

## Next Steps After Redis Installation

1. **Production Deployment** (see PRODUCTION_DEPLOYMENT_GUIDE.md)
2. **SEO Validation** (see SEO_VALIDATION_CHECKLIST.md)
3. **Performance Monitoring** (set up dashboards)
4. **Update IMPROVEMENT_PLAN.md** (mark Phase 1.3 as 100% complete)

---

## Useful Commands Cheat Sheet

```powershell
# Redis Service Management
Get-Service Redis                    # Check status
Start-Service Redis                  # Start Redis
Stop-Service Redis                   # Stop Redis
Restart-Service Redis                # Restart Redis

# Redis CLI
redis-cli                            # Connect to Redis
redis-cli PING                       # Test connection
redis-cli KEYS *                     # List all keys
redis-cli FLUSHALL                   # Clear all databases
redis-cli INFO                       # Get server info
redis-cli MONITOR                    # Monitor commands in real-time

# Laravel Artisan
php artisan config:clear             # Clear config cache
php artisan cache:clear              # Clear application cache
php artisan redis:ping               # Test Redis connection
php artisan tinker                   # Interactive PHP shell

# Testing
Measure-Command { Invoke-WebRequest http://localhost:8000/api/v1/products }
```

---

**Document Status:** Ready for implementation  
**Estimated Time:** 1-2 hours (installation + configuration + testing)  
**Difficulty:** Moderate (straightforward with this guide)
