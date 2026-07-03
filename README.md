# StudyFlip AI: AI-Powered Interactive Learning Platform

StudyFlip AI is a premium, state-of-the-art interactive study platform that transforms standard document uploads (like lecture notes, research papers, and PDFs) into comprehensive, personalized learning suites. By integrating the advanced Google Gemini AI, StudyFlip generates active-recall study tools, interactive quizzes, conversational tutoring, and podcast scripts.

---

## 🌟 Key Features

### 1. 📄 Document Upload & Parsing
- Effortless upload of PDF and text-based files.
- Automated content extraction to prime the learning model.

### 2. 📝 AI-Generated Study Summaries
- Instantly constructs structured study summaries in markdown.
- Formatted sections include **Overview**, **Key Terms**, **Summary**, and **Study Tips** to maximize retention.

### 3. 📇 Active-Recall Flashcards
- Automatically generates question-and-answer flashcard decks.
- Interactive UI to flip cards and test key concepts dynamically.

### 4. 🧠 Interactive Quizzes
- Generates up to 10 custom multiple-choice questions per document.
- Multiple difficulty tiers (Easy, Medium, Hard).
- Instant score tracking and result analytics recorded in the database.

### 5. 💬 Interactive AI Study Tutor
- Integrated chatbot specialized in the document context.
- Allows real-time learning conversations, follow-up questions, and targeted explanations.

### 6. 🎙️ Podcast Script Generator
- Transforms technical text into an engaging, multi-speaker discussion/podcast script.
- Generates natural dialogue structures ready for reading or Text-to-Speech synthesis.

---

## 🛠️ Technology Stack & Skills

### Backend & Core
- **Laravel (PHP 8.2+)**: Robust architecture, authentication, routing, and database migrations.
- **Inertia.js**: Seamless bridge connecting the Laravel backend with a modern React frontend.
- **Eloquent ORM**: Structured database models and relational mapping.

### Frontend
- **React.js (React 18)**: High-performance component-driven interface.
- **TypeScript**: Type safety across state, properties, and API payloads.
- **TailwindCSS**: Premium responsive layouts, modern color palettes, and glassmorphic UI.
- **Lucide Icons & Headless UI**: Polished, accessible interactive web widgets.
- **Vite**: Rapid asset compilation and hot module reloading.

### Artificial Intelligence
- **Google Gemini API**: Utilizes the high-efficiency `gemini-2.5-flash` model for generating high-fidelity study assets and conversational tutoring.

---

## 🚀 Installation & Setup

Follow these steps to set up the project locally:

### 1. Prerequisites
Ensure you have the following installed on your machine:
- PHP (>= 8.2)
- Composer
- Node.js (>= 18) & NPM
- SQLite, MySQL, or another Laravel-compatible database

### 2. Clone the Repository
```bash
git clone https://github.com/YOUR_USERNAME/studyflip-ai.git
cd studyflip-ai
```

### 3. Install Dependencies
```bash
# Install PHP packages
composer install

# Install Frontend packages
npm install
```

### 4. Configure Environment Variables
Copy the template `.env.example` to `.env`:
```bash
copy .env.example .env
```
Open `.env` and configure:
- Your database connection details.
- Add your Google Gemini API key:
  ```env
  GEMINI_API_KEY=your_actual_gemini_api_key_here
  ```

### 5. Run Database Migrations
```bash
php artisan migrate
```

### 6. Run the Application
Start both the Laravel backend server and Vite frontend server:

```bash
# Start Laravel development server
php artisan serve

# Start Vite development server (in a separate terminal)
npm run dev
```

---

## 📹 Video Demonstration
A complete walkthrough video showing StudyFlip AI in action is included in this repository:
- **Video file:** `AI-Powered-Interactive-Learning-Platform.mp4`

> [!TIP]
> You can download and watch the video directly, or view it on GitHub when configured!
