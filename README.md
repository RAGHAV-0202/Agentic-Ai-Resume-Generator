# Agentic AI Resume Generator 🚀

An advanced, AI-powered resume builder that treats your resume as a coding project. Features a real-time LaTeX preview, an intelligent AI copilot (powered by Groq), and a robust admin management system.

![Project Banner](https://placehold.co/1200x400?text=Agentic+AI+Resume+Generator)

## ✨ Key Features

- **🤖 AI Copilot**: Intelligent chat agent (Groq) that helps you write content, optimize bullet points, and fix grammar in real-time.
- **📄 Real-Time PDF Preview**: Instant feedback with live LaTeX compilation. See exactly how your resume looks as you edit.
- **🛡️ Admin Dashboard**: comprehensive admin panel to manage users, track usage, and upload new LaTeX templates.
- **🎨 Template System**: Dynamic template gallery with thumbnail previews. Admins can upload new templates (LaTeX + Image) directly.
- **🔐 Secure Auth**: Role-based authentication (User & Admin) using JWT and secure cookies.
- **☁️ Cloud Storage**: Cloudinary integration for storing resume assets and template thumbnails.

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 19 (Vite)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **State**: React Hooks (useState, useEffect)

### Backend
- **Runtime**: Node.js & Express
- **Database**: MongoDB (Mongoose)
- **AI Engine**: Groq SDK
- **File Uploads**: Multer & Cloudinary
- **PDF Generation**: `pdflatex` (System Requirement)
- **Security**: JWT, Bcrypt, CORS

## 🚀 Getting Started

### Prerequisites

1.  **Node.js** (v18+)
2.  **MongoDB** (Local or Atlas)
3.  **TeX Live / MacTeX**: Required for `pdflatex` command.
    -   *Mac*: `brew install --cask mactex-no-gui`
    -   *Linux*: `sudo apt-get install texlive-latex-base texlive-fonts-recommended texlive-latex-extra`
4.  **Groq API Key**: For AI features.
5.  **Cloudinary Account**: For image uploads.

### Installation

1.  **Clone the Repo**
    ```bash
    git clone https://github.com/yourusername/agentic-ai-resume-generator.git
    cd agentic-ai-resume-generator
    ```

2.  **Backend Setup**
    ```bash
    cd Backend
    npm install
    ```
    Create a `.env` file in `Backend`:
    ```env
    PORT=8000
    MONGODB_URI=mongodb://localhost:27017/ai-resume
    
    # Security
    ACCESS_TOKEN_SECRET=your_secret
    ACCESS_TOKEN_EXPIRY=1d
    REFRESH_TOKEN_SECRET=your_refresh_secret
    REFRESH_TOKEN_EXPIRY=10d
    ADMIN_ACCESS_TOKEN_SECRET=admin_secret
    ADMIN_ACCESS_TOKEN_EXPIRY=1d

    # AI
    GROQ_API_KEY=gsk_...

    # Cloudinary
    CLOUDINARY_CLOUD_NAME=...
    CLOUDINARY_API_KEY=...
    CLOUDINARY_API_SECRET=...

    # Client
    CORS_ORIGIN=http://localhost:5173
    ```

    Start the server:
    ```bash
    npm run dev
    ```

3.  **Frontend Setup**
    ```bash
    cd ../ai-resume-frontend
    npm install
    ```
    Start the vite server:
    ```bash
    npm run dev
    ```

## 🖥️ Usage

### User Portal
- Navigate to `http://localhost:5173`
- Register/Login
- Go to Dashboard -> Create Resume
- Chat with the AI to build your content
- Preview PDF in real-time

### Admin Portal
- Navigate to `http://localhost:5173/admin/login`
- Login with admin credentials (ensure you have an admin user in DB)
- **Dashboard**: View all registered users.
- **Templates**: Upload new LaTeX templates with thumbnails.

## 🤝 Contributing
Contributions are welcome! Please open an issue or submit a pull request.

## 📄 License
MIT
