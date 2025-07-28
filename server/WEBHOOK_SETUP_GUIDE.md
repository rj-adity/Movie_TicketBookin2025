# 🔗 Stripe Webhook Setup Guide for Vercel

## 🚀 **For Vercel Deployment**

### 1. **Get Your Vercel URL**
After deploying to Vercel, you'll get a URL like:
- `https://your-app-name.vercel.app`
- Or your custom domain if configured

### 2. **Set Environment Variables in Vercel**
In your Vercel dashboard, go to your project settings and add these environment variables:

```env
STRIPE_SECRET_KEY=sk_test_51RpVDn2WGxjJH0lV8WiHcOKwkHnDxyfVvd4e0DOh4t8BevwwVnFeGrpq91otdLpXC7tepwSBk73D5icRvQhOpWce00kt86tM8G
STRIPE_WEBHOOK_SECRET=whsec_3bbVfDrIEREHr56EEMeHmPdHMobhdA31
MONGODB_URI=your_mongodb_connection_string
CLERK_SECRET_KEY=your_clerk_secret_key
```

### 3. **Configure Stripe Webhook**
In your Stripe Dashboard:

1. Go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. **Endpoint URL**: `https://your-app-name.vercel.app/api/stripe`
4. **Events to send**:
   - ✅ `payment_intent.succeeded`
   - ✅ `checkout.session.completed`
5. Click **Add endpoint**

### 4. **Get Webhook Secret**
After creating the webhook:
1. Click on your webhook endpoint
2. Go to **Signing secret**
3. Click **Reveal** and copy the secret
4. Update `STRIPE_WEBHOOK_SECRET` in Vercel with this new secret

### 5. **Test Webhook Configuration**
Visit: `https://your-app-name.vercel.app/api/stripe/test`

This will show:
- ✅ Environment variables status
- ✅ Stripe connection status
- ✅ Correct webhook URL

## 🧪 **Testing**

### 1. **Test Payment Flow**
1. Make a test payment through your app
2. Check Vercel function logs for webhook events
3. Verify booking status updates in your database

### 2. **Check Vercel Logs**
1. Go to Vercel dashboard
2. Click on your project
3. Go to **Functions** tab
4. Look for `/api/stripe` function logs

### 3. **Monitor Webhook Events**
In Stripe Dashboard:
1. Go to **Developers** → **Webhooks**
2. Click on your webhook
3. Check **Recent deliveries** for success/failure

## 🔧 **Troubleshooting**

### **Webhook Fails (400/500 errors)**
1. Check Vercel environment variables
2. Verify webhook secret matches
3. Check Vercel function logs
4. Ensure MongoDB connection is working

### **Payment Status Not Updating**
1. Check if webhook events are being received
2. Verify booking ID in session metadata
3. Check database connection in Vercel
4. Look for errors in Vercel function logs

### **Environment Variables Issues**
1. Redeploy after adding environment variables
2. Check variable names (case-sensitive)
3. Ensure no extra spaces in values

## 📋 **Webhook Events Handled**

- **`payment_intent.succeeded`**: Updates booking to paid when payment completes
- **`checkout.session.completed`**: Alternative event for payment completion

## 🔍 **Debugging Commands**

### Test Webhook Configuration
```bash
curl https://your-app-name.vercel.app/api/stripe/test
```

### Check Server Status
```bash
curl https://your-app-name.vercel.app/
```

## ⚠️ **Important Notes**

1. **Webhook Secret**: Must match between Stripe and Vercel
2. **Environment Variables**: Must be set in Vercel dashboard
3. **Function Timeout**: Vercel functions have 30-second timeout
4. **Database Connection**: Ensure MongoDB connection works in serverless environment
5. **Logs**: Check Vercel function logs for debugging

## 🎯 **Success Indicators**

- ✅ Webhook test endpoint returns success
- ✅ Payment status updates after successful payment
- ✅ No failed webhook deliveries in Stripe
- ✅ Clean logs in Vercel function monitoring 