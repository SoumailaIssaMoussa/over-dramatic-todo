# 🎭 Over-Dramatic To-Do

> *Where every task is a tragedy. Where every checkbox is a battle. Where productivity meets existential dread.*

A MERN-stack web application that transforms mundane task management into a hilariously over-engineered dramatic experience. Built for **CSE 4540 / CSE 4578 Web Programming Lab**.

---

## 🎬 Theme: Life, But Make It Weird

This is not a to-do app. This is a **stage for your daily suffering**. Every task you create is a *crisis*. Every deadline is a *day of reckoning*. Completing a task doesn't just tick a box — the universe *reacts* with shock and disbelief.

### Dramatic Features

- **Drama Slider (1–10)**: Rate every task from *Mildly Inconvenient* to *☠️ END OF THE WORLD*
- **Catastrophic Filter**: See only your most apocalyptic tasks
- **Dramatic Notifications**: Every action triggers a theatrical server-side notification
- **Completion Reactions**: Random dramatic messages when you survive a task
- **Animated Drama Meter**: The sidebar tracks your average suffering level
- **Overdue Blinking**: Overdue tasks literally blink at you in red
- **Theatrical UI**: Dark, atmospheric design with glowing purple/pink gradients

---

## 🏗️ Tech Stack (MERN)

| Layer | Tech |
|---|---|
| Frontend | React 19 + Vite |
| Styling | Custom CSS (no templates) |
| Backend | Node.js + Express.js |
| Database | MongoDB Atlas + Mongoose |
| Auth | JWT (bcryptjs hashing) |
| Routing | React Router DOM v7 |

---

## ⚡ Quick Start

### 1. Backend Setup

```bash
cd backend
npm install
# .env is already configured. You may update MONGO_URI and JWT_SECRET.
npm run dev
```

Backend runs on: `http://localhost:5000`

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on: `http://localhost:5173`

---

## 📁 Project Structure

```
over-dramatic-todo/
├── backend/
│   ├── config/db.js              # MongoDB connection
│   ├── middleware/authMiddleware.js # JWT protect middleware
│   ├── models/
│   │   ├── User.js               # User schema
│   │   ├── Task.js               # Task schema (with dramaLevel, category, attachment, dueDate)
│   │   ├── Category.js           # Category schema
│   │   └── Notification.js       # Notification schema
│   ├── routes/
│   │   ├── userRoutes.js         # Register, Login, Profile, Change Password
│   │   ├── taskRoutes.js         # Full CRUD + Stats + Filtering
│   │   ├── categoryRoutes.js     # Category CRUD
│   │   └── notificationRoutes.js # Notification management
│   └── server.js
│
└── frontend/
    └── src/
        ├── components/
        │   ├── Header.jsx        # Search, notifications panel, user menu
        │   ├── Sidebar.jsx       # Filter nav + drama scale legend + mood meter
        │   ├── TaskCard.jsx      # Task row with completion reactions
        │   ├── AddTaskModal.jsx  # Full task creation modal
        │   └── DramaSlider.jsx   # The iconic 1–10 drama level slider
        ├── pages/
        │   ├── Login.jsx         # Dramatic login page
        │   ├── Register.jsx      # Registration page
        │   └── Tasks.jsx         # Main dashboard
        └── services/api.js       # All API calls
```

---

## 🔐 API Endpoints

### Users
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/users/register` | No | Register |
| POST | `/api/users/login` | No | Login |
| GET | `/api/users/profile` | Yes | Get profile |
| PUT | `/api/users/profile` | Yes | Update profile |
| PUT | `/api/users/change-password` | Yes | Change password |

### Tasks
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/tasks` | Yes | Get all (with filter/sort/search) |
| POST | `/api/tasks` | Yes | Create task |
| PUT | `/api/tasks/:id` | Yes | Update task |
| DELETE | `/api/tasks/:id` | Yes | Delete task |
| GET | `/api/tasks/stats/summary` | Yes | Get stats |

### Categories
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/categories` | Yes | Get all categories |
| POST | `/api/categories` | Yes | Create category |
| PUT | `/api/categories/:id` | Yes | Update category |
| DELETE | `/api/categories/:id` | Yes | Delete category |

### Notifications
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/notifications` | Yes | Get all |
| PUT | `/api/notifications/read-all` | Yes | Mark all read |
| DELETE | `/api/notifications` | Yes | Clear all |

---

## 👥 Team Members

| Name | Student ID |
|---|---|
| Issa Soumalia | 220041267 |
| Idriss Rayan | 220041257 |
| Soundjo Abdoul Razak | 220041258 |

---

*"What is productivity but suffering with purpose?"*
