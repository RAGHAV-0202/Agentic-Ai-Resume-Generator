# Ai-Resume

Ai-Resume is an intelligent resume generator that leverages AI to create professional, high-quality resumes using LaTeX. The application allows users to register, manage their profiles, select from various resume templates, and generate downloadable PDFs.

## Project Structure

This project is a monorepo consisting of:

-   **Backend/**: A Node.js and Express server that handles:
    -   User Authentication (JWT).
    -   Resume data management (MongoDB).
    -   PDF generation via LaTeX.
    -   AI-powered chat assistance.
-   **ai-resume-frontend/**: A modern React application built with Vite for the user interface.

## Features

-   **Authentication**: Secure user registration, login, and password management.
-   **Resume Builder**: Create and edit multiple resumes with structured data.
-   **LaTeX Templates**: professional templates for high-quality formatting.
-   **PDF Generation**: Convert resumes to polished PDF documents.
-   **AI Chat**: Interactive chat interface for assistance.
-   **Responsive Design**: Modern UI built with React.

## Tech Stack

### Frontend
-   **Framework**: React 19
-   **Build Tool**: Vite
-   **Styling**: CSS / Styled Components (inferred)
-   **Linting**: ESLint

### Backend
-   **Runtime**: Node.js
-   **Framework**: Express.js
-   **Database**: MongoDB (Mongoose)
-   **Caching**: Redis (ioredis)
-   **Storage**: Cloudinary
-   **Security**: bcryptjs, jsonwebtoken, cors

## Getting Started

### Prerequisites

Ensure you have the following installed:
-   [Node.js](https://nodejs.org/) (v16+ recommended)
-   [MongoDB](https://www.mongodb.com/) (Local or Atlas connection string)
-   [Redis](https://redis.io/) (for caching/sessions)
-   A LaTeX distribution (e.g., TeX Live) if running PDF generation locally without a container.

### Installation

1.  **Clone the repository**
    ```bash
    git clone <repository-url>
    cd Ai-Resume
    ```

2.  **Backend Setup**
    ```bash
    cd Backend
    npm install
    ```
    -   Create a `.env` file in the `Backend` directory.
    -   Configure your environment variables (PORT, MONGO_URI, REDIS_URL, CLOUDINARY_*, JWT_SECRET, etc.).
    -   Start the backend development server:
        ```bash
        npm run dev
        ```
    -   The server usually runs on port `8080`.

3.  **Frontend Setup**
    ```bash
    cd ../ai-resume-frontend
    npm install
    ```
    -   Start the frontend development server:
        ```bash
        npm run dev
        ```
    -   The frontend will be available at `http://localhost:5173`.

## Usage

1.  Open the frontend URL in your browser.
2.  Register for a new account.
3.  Navigate to the dashboard to create a new resume.
4.  Fill in your details, select a template, and generate your resume PDF.

## Contributing

Contributions are welcome! Please fork the repository and submit a pull request for any improvements.
