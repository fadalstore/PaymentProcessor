# CourseHub - Deployment Guide for Render.com

## Faallo Deployment-ka (Render.com)

### 1. Diyaarinta Deployment-ka

Waxyaabaha la diyaariyay:
- ✅ `render.yaml` - Deployment configuration
- ✅ Health check endpoint - `/api/health`
- ✅ Environment variables - `.env.example`
- ✅ Build commands - `npm run build`
- ✅ Production start - `npm start`

### 2. Render.com Deploy Tallaabooyinka

#### Tallaabo 1: Account Samee
1. Tag [render.com](https://render.com)
2. Samee account cusub ama gal mid jira
3. Connect GitHub/GitLab account-kaaga

#### Tallaabo 2: Database Samee (Optional)
1. Dashboard-ka Render.com, click "New +"
2. Dooro "PostgreSQL"
3. Magaca database: `coursehub-db`
4. Plan: Free tier
5. Copy DATABASE_URL markii la sameeyo

#### Tallaabo 3: Web Service Deploy
1. Dashboard-ka, click "New +"
2. Dooro "Web Service"
3. Connect repository-kaaga
4. Deployment settings:
   - **Name**: coursehub
   - **Environment**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`

#### Tallaabo 4: Environment Variables Ku Dar
Render dashboard-ka, "Environment" tab-ka:

**Required:**
- `NODE_ENV` = `production`
- `DATABASE_URL` = [Copy from database]

**Optional (for features):**
- `SLACK_BOT_TOKEN` = [Your Slack bot token]
- `SLACK_CHANNEL_ID` = [Your Slack channel ID]
- `WAAFI_MERCHANT_UID` = [WaafiPay merchant ID]
- `WAAFI_API_USER_ID` = [WaafiPay API user]
- `WAAFI_API_KEY` = [WaafiPay API key]
- `STRIPE_SECRET_KEY` = [Stripe secret key]
- `STRIPE_PUBLISHABLE_KEY` = [Stripe publishable key]

### 3. Deployment Check

Markii deployment-ku dhammaado:
1. Check health endpoint: `https://your-app.onrender.com/api/health`
2. Test homepage: `https://your-app.onrender.com`
3. Test course browsing iyo purchasing

### 4. Troubleshooting

**Build Issues:**
- Hubi in dependencies-yadu si fiican u install garoobaan
- Check build logs si aad u aragto khaladaadka

**Runtime Issues:**
- Check environment variables
- Monitor logs Dashboard-ka Render.com
- Verify database connection

**Performance:**
- Free tier wuxuu leeyahay limitations
- Cold starts - server-ku waqti qaadan karaa startup-ka