# Deployment guide

## Render deployment
1. Create a GitHub repository and push this project there.
2. Open Render and create a new Web Service.
3. Connect the repository.
4. Use these settings:
   - Build Command: npm install
   - Start Command: npm start
5. Add environment variables if needed:
   - NODE_ENV=production
   - PORT=10000
   - HOST=0.0.0.0

## Notes
- The app already starts with Node.js and Express.
- MongoDB is optional; the app can run without it, but database-backed features will be limited.
- The health endpoint is available at /api/health.
