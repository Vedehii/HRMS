# Backend Deployment Guide

## Deploy to Railway

1. **Create Railway account:** https://railway.app/

2. **Create new project:**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Connect your repository
   - Select `backend` folder as root directory

3. **Add MongoDB database:**
   - In Railway project, click "New"
   - Select "Database" → "MongoDB"
   - Railway will provision MongoDB and provide connection string

4. **Set environment variables:**
   - Go to project settings → Variables
   - Add:
     ```
     MONGODB_URI=mongodb://[generated-by-railway]
     JWT_SECRET=your-strong-secret-key
     PORT=5000
     NODE_ENV=production
     ```

5. **Deploy:**
   - Railway automatically deploys on git push
   - Get your backend URL: `https://your-app.railway.app`

## Deploy to Render

1. **Create Render account:** https://render.com/

2. **Create new Web Service:**
   - Click "New" → "Web Service"
   - Connect your GitHub repository
   - Root directory: `backend`

3. **Configure service:**
   - Name: `hr-salary-backend`
   - Environment: `Node`
   - Build command: `npm install`
   - Start command: `npm start`

4. **Add MongoDB Atlas:**
   - Create free cluster on MongoDB Atlas
   - Get connection string

5. **Set environment variables:**
   - Go to Environment tab
   - Add:
     ```
     MONGODB_URI=mongodb+srv://...
     JWT_SECRET=your-strong-secret-key
     NODE_ENV=production
     ```

6. **Deploy:**
   - Click "Create Web Service"
   - Get your backend URL: `https://your-app.onrender.com`

## Deploy to Heroku

1. **Install Heroku CLI:**
```bash
npm install -g heroku
```

2. **Login to Heroku:**
```bash
heroku login
```

3. **Create Heroku app:**
```bash
cd backend
heroku create hr-salary-backend
```

4. **Add MongoDB:**
```bash
heroku addons:create mongolab:sandbox
```

5. **Set environment variables:**
```bash
heroku config:set JWT_SECRET=your-strong-secret-key
heroku config:set NODE_ENV=production
```

6. **Deploy:**
```bash
git push heroku main
```

7. **Get your URL:**
```bash
heroku open
```

---

## Post-Deployment

1. **Test API endpoints:**
```bash
curl https://your-backend-url.com/api/auth/login -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password123"}'
```

2. **Seed production database:**
```bash
# SSH into your server or run script locally with production DB
node src/scripts/seed.js
```

3. **Monitor logs:**
   - Railway: Dashboard → Logs
   - Render: Dashboard → Logs
   - Heroku: `heroku logs --tail`

4. **Update frontend with backend URL**
