# 🌟 BugTracker – Team Collaboration & Issue Management

**BugTracker** is a sleek, full-stack web application built to help teams manage software projects, track issues, and collaborate efficiently. Designed with a clean UI and an intuitive Kanban workflow, it offers essential features like project creation, ticket assignment, threaded comments, and powerful filters.

---

## 🚀 Features

- 📁 **Project Management** – Create and manage collaborative projects
- 🪲 **Issue Tracker** – Report bugs or feature requests as tickets
- 👥 **Assign Members** – Assign issues to project members
- 🧩 **Kanban Board** – Move tickets across **To Do**, **In Progress**, and **Done**
- 💬 **Threaded Comments** – Collaborate directly on issues
- 🔍 **Filter & Search** – By status, priority, assignee, or keyword
- ✏️ **Edit/Delete Tickets** – Manage ticket lifecycle (permission-based)
- 🛡️ **Role-Based Access** – Admin, manager, developer
- 📎 **Screenshot Uploads** – Optional file attachment support
- 🔒 **Authentication** – JWT + bcrypt for secure login/register
- 📱 **Responsive Design** – Seamless experience across devices
- 🎨 **Minimal UI** – Focused, distraction-free interface

---

## 📸 Screenshots

### 🔐 Register Page
![Register](https://github.com/user-attachments/assets/ae387194-8d28-4bbe-ae8c-533c5b042042)

### 🔐 Login Page
![Login](https://github.com/user-attachments/assets/d12d57c9-4e0f-4ee9-b567-c69d62c2fd98)


### 🏠 Home Page
![Home](https://github.com/user-attachments/assets/21c8cf73-46b0-4a26-8b1d-235909f81f2b)


### 📁 Project Page
![project1](https://github.com/user-attachments/assets/123bf099-ef48-431d-af12-b15f40a0ab6e)


### 🪲 Ticket Page
![Ticket1](https://github.com/user-attachments/assets/a305fc9d-987a-4910-af63-c9e88164fcfd)



---

## 🧰 Tech Stack

### 🔹 Frontend

- **React.js** – Component-based UI
- **Tailwind CSS** – Modern responsive styling
- **React DnD / react-beautiful-dnd** – Drag-and-drop Kanban board
- **Axios** – API calls
- **React Router** – Navigation

### 🔸 Backend

- **Node.js + Express.js** – REST API
- **MongoDB + Mongoose** – NoSQL database
- **JWT + bcrypt** – User authentication & route protection

### 🛠️ Extras 

- **Helmet, CORS, dotenv** – Security and configuration
- **Multer**  – File attachments support

---

## 🗂️ Use Cases

| #  | Use Case                 | Description                                                             |
|----|--------------------------|-------------------------------------------------------------------------|
| 1  | User Authentication      | Users can register/login, JWT auth used to protect routes               |
| 2  | Project Management       | Users can create projects, invite team members                          |
| 3  | Create Issue             | Users can create bug reports or feature requests within a project       |
| 4  | Assign Users             | Assign tickets to members of the same project                           |
| 5  | Kanban Board             | Drag tickets between “To Do”, “In Progress”, and “Done”                 |
| 6  | Comments on Tickets      | Team members can collaborate via threaded comments                      |
| 7  | Filter & Search Tickets  | Filter tickets by status, priority, assignee, or keyword                |
| 8  | Edit/Delete Tickets      | Update or delete tickets (permission-based)                             |
| 9  | Role-Based Access        | Admin, manager, developer                      |
| 10 | Upload Screenshot        | Attachments to support bug report clarity                               |

---


## ⚙️ Setup Instructions

Follow these steps to run the project locally:

---

### 🧱 Prerequisites

Make sure you have the following installed:

- Node.js (v16 or later)  
- MongoDB (local or MongoDB Atlas)  
- npm (comes with Node)

---

### 📦 1. Clone the Repository

<pre>
git clone https://github.com/UdaynoorSingh/Bug-Tracker2
cd your-repo-name
</pre>

---

### 🔧 2. Backend Setup

<pre>
cd backend  
npm install
</pre>

Create a `.env` file inside the `backend/` folder and add:

<pre>
PORT=5000
MONGODB_URI=your_mongodb_connection
JWT_SECRET=your_secret_key
CLIENT_URL=http://localhost:5173
VITE_API_BASE_URL=http://localhost:5000/api
EMAIL_USER=your_gmail_id
EMAIL_PASS=generated_pass_from_gmail(not your real password)
CORS_ORIGIN=http://localhost:3000
UPLOAD_LIMIT=5MB
FRONTEND_URL = 
BASE_URL=
</pre>

Run the backend:

<pre>
npm run dev
</pre>

It will run on: `http://localhost:5000`

---

### 🌐 3. Frontend Setup

<pre>
cd ../frontend  
npm install
</pre>

Create a `.env` file inside the `frontend/` folder and add:

<pre>
VITE_API_URL=http://localhost:5000/api
</pre>

Run the frontend:

<pre>
npm start
</pre>

It will run on: `http://localhost:3000`

---

### 🧪 4. Open the App

Visit `http://localhost:3000` in your browser.  
You should see the login or home page!

---

### 🚀 Deployment (Optional)

You can deploy the app using:

- Frontend → [Vercel](https://vercel.com/) 
- Backend → [Render](https://render.com/)
- Database → [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)

---

## 💬 Feedback

If you find this project useful, please ⭐ the repo and share feedback!  
Pull requests and contributions are welcome.

---
