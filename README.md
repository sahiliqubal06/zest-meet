# 💬 ZestMeet

A modern real-time communication platform built with the **MERN stack**, **WebRTC**, and **Socket.IO**. ZestMeet enables seamless **video/audio calls**, **real-time messaging**, and provides a clean, responsive user experience using **Material UI**.

---

## 🌐 Deployment Link

Access the live application here:
🔗 [ZestMeet Live](https://zest-meet.onrender.com)

---

## 🚀 Features

### 🔐 Authentication & Authorization

* Route protection & token validation

### 💬 Real-time Messaging

* Live 1:1 chat using **Socket.IO**

### 📞 Video/Audio Calling (WebRTC)

* Peer-to-peer calling using **WebRTC**
* Audio/Video stream handling
* Signaling through **Socket.IO**
* Call control (mute, hang-up) UI

### 🖥️ User Interface

* Built with **React 19**, **Material UI**, and **Vite**
* Responsive, dark/light friendly theme
* Clean component-based architecture

### 🛡️ Secure Communication

* REST APIs with Express
* Encrypted tokens 
* Error handling middleware

---

## 🛠️ Tech Stack

### **Frontend**

* React 19 + Vite
* Material UI & Emotion
* React Router
* Socket.IO Client
* WebRTC API
* Axios
* Environment Config Support

### **Backend**

* Node.js + Express
* Socket.IO for signaling and real-time chat
* MongoDB + Mongoose 
* HTTP Status Management

---

## 📂 Project Structure

### 🔧 Backend

```
backend/
└── src/
    ├── controllers/    # Chat & call controllers
    ├── db/             # DB connection config
    ├── middlewares/    # Error handling, auth
    ├── models/         # Mongoose models
    ├── routes/         # API routes (auth, messages)
    ├── utils/          # Helper functions
    └── app.js          # Main Express setup
```

### 🎨 Frontend

```
frontend/
├── public/
│   └── index.html
├── src/
│   ├── assets/         # Images, icons
│   ├── contexts/       # React contexts
│   ├── pages/          # App pages (Chat, Call, etc.)
│   ├── styles/         # styles
│   ├── utils/          # WebRTC, socket utilities
│   ├── App.css
│   ├── App.jsx
│   ├── environment.js  # API URLs & ENV constants
│   ├── index.css
│   └── main.jsx        # Entry point
├── vite.config.js
```

---

## ⚙️ Installation

### Prerequisites:

* Node.js and npm
* MongoDB 

---

### Steps:

1. **Clone the Repository**

```bash
https://github.com/sahiliqubal06/zest-meet.git
cd ZestMeet
```

2. **Install Dependencies**

```bash
# Backend
cd backend
npm install

# Frontend
cd frontend
npm install
```

3. **Setup Environment Variables**

Create a `.env` file in `/backend`:

```env
PORT=8000
MONGO_URI=your-mongodb-uri   
```

---

## 🚀 Running the Application

### Backend:

```bash
cd backend
npm run dev
```

### Frontend:

```bash
cd frontend
npm run dev
```

---

## 🧪 WebRTC Integration Notes

* Uses native **WebRTC** APIs (`getUserMedia`, RTCPeerConnection)
* Socket.IO handles **signaling** (offer/answer + ICE candidates)
* Optimized for 1-on-1 peer connections
* Ensure HTTPS or localhost for camera/mic permissions

---

## 📜 License

This project is licensed under the **MIT License**. See the LICENSE file for details.

---

## 📧 Contact

Created by **Sahil Iqubal**
For queries or collaborations, reach out via GitHub or LinkedIn.

