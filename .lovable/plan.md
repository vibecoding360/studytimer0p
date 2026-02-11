

# Syllabus Command — Premium Syllabus Management MVP

## Design & Aesthetic
- **Dark mode by default** with Apple/Linear-inspired minimalism
- Inter font, high-contrast typography, subtle glassmorphism (frosted-glass cards, soft borders)
- Smooth micro-animations and transitions throughout
- Sleek collapsible sidebar navigation with icons

## Backend (Lovable Cloud)
- **Authentication**: Email sign-up/login so students can access their data across devices
- **Database**: Tables for courses, syllabus data (key dates, grading weights, reading lists), and user scores
- **AI Edge Function**: Receives uploaded syllabus text/images, calls Lovable AI (Gemini) to extract structured data (dates, grading breakdowns, reading lists) via tool calling
- **Storage**: Bucket for uploaded syllabus PDFs/images

## Pages & Features

### 1. Auth Pages
- Minimal login/signup screens matching the dark aesthetic

### 2. Dashboard (Home)
- Semester overview with **Course Cards** in a responsive grid
- Each card shows: course name, next upcoming deadline, overall grade standing, progress indicator
- Quick-add button to create a new course

### 3. AI Syllabus Parser
- Drag-and-drop upload zone for PDF or image files
- Sends file to an edge function → Lovable AI extracts key dates, grading breakdown, and reading list
- Results displayed in a clean structured table with sections for Dates, Weights, and Readings
- One-click save to attach parsed data to a course

### 4. Smart Calendar
- Timeline/agenda view showing all extracted dates across courses
- "High Stakes" events (Finals, Midterms) visually highlighted with badges/colors
- Filter by course; toggle between week/month views

### 5. Grade Weight Calculator
- Select a course → see its grading breakdown (pulled from parsed syllabus)
- Input current scores per category (e.g., Homework 85%, Midterm 72%)
- Real-time weighted grade calculation with a visual progress bar showing current standing and what's needed for target grades (A, B, etc.)

### 6. Sidebar Navigation
- Collapsible sidebar with icon-only mini mode
- Links: Dashboard, Calendar, Grade Calculator
- User avatar + logout at the bottom

