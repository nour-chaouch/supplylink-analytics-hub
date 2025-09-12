# SupplyLink Analytics Hub

A comprehensive analytics platform for supply chain and agricultural data analysis.

## 🚀 Quick Start

### Option 1: Using the startup script (Recommended)

**Windows:**
```bash
start-dev.bat
```

**Linux/Mac:**
```bash
chmod +x start-dev.sh
./start-dev.sh
```

### Option 2: Manual startup

1. **Start Backend Server:**
   ```bash
   cd backend
   npm install
   npm run dev
   ```
   Backend will run on: http://localhost:5001

2. **Start Frontend Server:**
   ```bash
   npm install
   npm run dev
   ```
   Frontend will run on: http://localhost:8080

## 📊 Server Information

- **Backend API**: http://localhost:5001
- **Frontend App**: http://localhost:8080
- **Health Check**: http://localhost:5001/api/health

## 🔧 Configuration

### Backend Environment Variables

Create a `.env` file in the `backend` directory with:

```env
NODE_ENV=development
PORT=5001
MONGO_URI=mongodb://localhost:27017/supplylink
JWT_SECRET=your_jwt_secret_key_here_change_in_production
FRONTEND_URL=http://localhost:8080
```

### Frontend Configuration

The frontend is configured to proxy API calls to the backend automatically via Vite's proxy configuration.

## 🛠️ Development

### Backend Features
- Express.js server with CORS enabled
- MongoDB integration (optional for development)
- JWT authentication
- FAO STAT data integration
- User management system

### Frontend Features
- React with TypeScript
- Vite for fast development
- Tailwind CSS for styling
- Shadcn/ui components
- Redux Toolkit for state management
- React Query for data fetching

## 📁 Project Structure

```
supplylink/
├── backend/                 # Backend server
│   ├── config/             # Database and app configuration
│   ├── controllers/        # Route controllers
│   ├── middleware/         # Express middleware
│   ├── models/            # MongoDB models
│   ├── routes/            # API routes
│   ├── scripts/           # Data scraping scripts
│   └── server.js          # Main server file
├── src/                   # Frontend source code
├── public/               # Static assets
├── start-dev.sh          # Linux/Mac startup script
├── start-dev.bat         # Windows startup script
└── package.json          # Frontend dependencies
```

## 🔍 Troubleshooting

### Port Already in Use
If you get a "port already in use" error:
1. Check what's running on the port: `netstat -an | findstr :5001` (Windows) or `lsof -i :5001` (Mac/Linux)
2. Stop the process using that port
3. Restart the servers

### Database Connection Issues
The backend will start without a database connection in development mode. To use database features:
1. Install MongoDB locally or use MongoDB Atlas
2. Set the `MONGO_URI` environment variable
3. Restart the backend server

### Frontend Not Loading
1. Check if the backend is running on port 5001
2. Verify the proxy configuration in `vite.config.ts`
3. Check browser console for errors

## 📝 API Endpoints

- `GET /api/health` - Health check
- `POST /api/users/register` - User registration
- `POST /api/users/login` - User login
- `GET /api/faostat/*` - FAO STAT data endpoints

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test both frontend and backend
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.
