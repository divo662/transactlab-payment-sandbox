# Redis Setup for Production (Render)

## Quick Setup

### 1. Add Redis Addon to Render

1. Go to your [Render Dashboard](https://dashboard.render.com)
2. Navigate to your backend service
3. Click on the **"Add-ons"** tab
4. Click **"New Add-on"**
5. Select **"Redis"**
6. Choose a plan:
   - **Free**: 25MB memory, 1 connection (good for development)
   - **Starter**: 250MB memory, 20 connections ($7/month)
   - **Standard**: 1GB memory, 100 connections ($20/month)

### 2. Environment Variables

After adding the Redis addon, Render will automatically create these environment variables:

- `REDIS_URL`: The connection string (e.g., `redis://user:password@host:port`)

### 3. Verify Setup

After deployment, you should see these logs instead of warnings:

```
✅ Redis ready
🔗 Redis connected
```

Instead of:
```
[warn]: Redis not available, skipping cache get
[warn]: Redis not available, skipping cache set
```

## Alternative: External Redis Services

If you prefer external Redis services, here are some options:

### Redis Cloud (Recommended)
1. Sign up at [Redis Cloud](https://redis.com/redis-enterprise-cloud/overview/)
2. Create a free database (30MB)
3. Get the connection string
4. Add it as `REDIS_URL` in Render environment variables

### Upstash Redis
1. Sign up at [Upstash](https://upstash.com/)
2. Create a Redis database
3. Get the connection string
4. Add it as `REDIS_URL` in Render environment variables

## Troubleshooting

### Check Redis Connection
Add this endpoint to test Redis connectivity:

```typescript
// Add to your routes
app.get('/health/redis', async (req, res) => {
  try {
    const isAvailable = redisClient.isAvailable();
    res.json({
      redis: isAvailable ? 'connected' : 'disconnected',
      status: isAvailable ? 'healthy' : 'unhealthy'
    });
  } catch (error) {
    res.status(500).json({
      redis: 'error',
      status: 'unhealthy',
      error: error.message
    });
  }
});
```

### Common Issues

1. **Connection Timeout**: Check if Redis addon is running
2. **Authentication Failed**: Verify `REDIS_URL` format
3. **Memory Limit**: Upgrade to a higher plan if hitting memory limits

## Performance Benefits

With Redis enabled, you'll get:
- ✅ Faster API responses (cached data)
- ✅ Reduced database load
- ✅ Better user experience
- ✅ Lower latency for repeated requests

## Cost

- **Free tier**: 25MB, perfect for development
- **Paid tiers**: Start from $7/month for production use
