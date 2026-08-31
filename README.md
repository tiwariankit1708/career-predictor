## AI Career Predictor

Next.js frontend application for AI-powered career guidance and interview preparation.

## Features

- 🏠 **Home Page**: Welcome page with navigation to main features
- 💼 **Interview Questions Generator**: Generate field-specific interview questions
- 🤖 **Career Model**: Ask AI career-related questions and get personalized advice

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/Ar2005ya-12232005a/AI-Career-Predictor.git
cd AI-Career-Predictor
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Run the development server:
```bash
npm run dev
# or
yarn dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Tech Stack

- **Frontend**: Next.js 14, React 18
- **Styling**: Tailwind CSS, shadcn/ui
- **Icons**: Lucide React
- **Backend**: Next.js API Routes (ready for Python backend integration)

## API Integration

The frontend is ready to connect to your Python backend:

- `/api/generate-questions` - For interview question generation
- `/api/ask-career-model` - For career advice questions

## Project Structure

```
├── app/
│   ├── page.js                    # Home page
│   ├── layout.js                  # App layout
│   ├── interview-questions/
│   │   └── page.js               # Interview questions generator
│   ├── career-model/
│   │   └── page.js               # Career advice Q&A
│   └── api/
│       └── [[...path]]/
│           └── route.js          # API routes
├── components/                    # shadcn/ui components
├── lib/                          # Utilities
└── package.json                  # Dependencies
```

## License

MIT License
