# BidSphere — Live Auction Platform

A full-stack real-time auction platform built with **React**, **Node.js**, **Express**, **MongoDB**, and **Socket.IO**.

## 🚀 Features

- 🔴 **Live Bidding** — Real-time bid updates via WebSockets
- 🔐 **Auth** — JWT login/register + Google OAuth sign-in
- 👤 **Role-based access** — Buyer, Seller, Admin roles
- 📦 **Seller Dashboard** — Create, end, and delete auctions
- 🏆 **Won Auctions** — Payment integration via Razorpay
- 🤖 **Auto-Bidding** — Set a max limit and bid automatically
- 🛡️ **Fraud Detection** — Auto-ban for rapid bid spam
- 👨‍💼 **Admin Dashboard** — Manage users, auctions, ban/unban
- 📱 **SMS Alerts** — Outbid notifications via Twilio
- 🔔 **AI Chatbot** — Powered by Gemini AI

## 🛠️ Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React, Vite, Tailwind CSS |
| Backend | Node.js, Express |
| Database | MongoDB + Mongoose |
| Realtime | Socket.IO |
| Auth | JWT + Google OAuth (GSI) |
| Payments | Razorpay |
| SMS | Twilio |
| AI | Google Gemini |

## ⚙️ Setup

### Backend
```bash
cd backend
npm install
# Copy .env.example to .env and fill in your keys
cp .env.example .env
npm run dev
```

### Frontend
```bash
cd frontend
npm install
# Create .env from example
cp .env.example .env
npm run dev
```

## 🔑 Environment Variables

### Backend `.env`
```
PORT=5000
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
GOOGLE_CLIENT_ID=your_google_client_id
RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret
EMAIL_USER=your_gmail
EMAIL_PASS=your_app_password
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=your_twilio_number
GEMINI_API_KEY=your_gemini_key
```

### Frontend `.env`
```
VITE_API_URL=http://localhost:5000/api
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

## 👤 Default Admin
```bash
cd backend
npm run seed:admin
```

---
Built with ❤️ by Paluvaivishnu
