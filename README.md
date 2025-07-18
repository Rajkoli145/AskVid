# AskVid – Video Q&A Platform

AskVid lets you ask natural-language questions about any YouTube video and get instant, context-aware answers powered by Google Gemini. Paste a video URL, we handle the rest: fetch metadata, transcribe the audio, and open an AI chat where you can explore the content.

---

[Live Demo](https://askvid.netlify.app)
## Screenshots

 <img width="1469" alt="Screenshot 2025-06-30 at 1 34 07 PM" src="https://github.com/user-attachments/assets/d363777b-a3ca-4137-88ec-8446d4a8b289" />

 <img width="1470" alt="Screenshot 2025-06-30 at 1 35 42 PM" src="https://github.com/user-attachments/assets/ca68e22b-a199-4ad5-b91e-97c1f396116e" />

<img width="1470" alt="Screenshot 2025-06-30 at 1 38 02 PM" src="https://github.com/user-attachments/assets/44300ff3-7848-4c65-a87b-58210128de4f" />

<img width="1470" alt="Screenshot 2025-06-30 at 1 39 20 PM" src="https://github.com/user-attachments/assets/706c325b-f89f-4397-8d67-ecef5b479d0c" />


## Features

• Paste a YouTube link and immediately chat with the video’s content  
• Automatic transcription & accurate timestamps  
• Rich chat interface with follow-up questions  
• Dark / light theme toggle  
• Responsive, mobile-friendly UI built with Tailwind CSS

## Tech Stack

- React 18 + TypeScript
- Vite build tooling
- Tailwind CSS & Lucide-React icons
- Axios for HTTP requests
- Google Gemini API for AI responses
- YouTube Data API v3 for video info

## Quick Start

1. **Clone & install**
   ```bash
   git clone https://github.com/your-username/askvid.git
   cd askvid
   npm install # or pnpm / yarn
   ```
2. **Configure environment variables** (see `.env.example`):
   ```env
   VITE_YOUTUBE_API_KEY=YOUR_YOUTUBE_KEY
   VITE_GEMINI_API_KEY=YOUR_GEMINI_KEY
   ```
3. **Run the dev server**
   ```bash
   npm run dev
   ```
   App will be available at `http://localhost:5173`.

## Project Structure

```
├─ src
│  ├─ components   # UI components (LandingPage, VideoProcessor, ChatInterface, …)
│  ├─ services     # YouTube, transcription & AI helpers
│  ├─ contexts     # React context providers
│  ├─ types        # Shared TS types
│  └─ assets       # Static assets
└─ public          # Static public files
```

## Available Scripts

| Script          | Purpose                |
| --------------- | ---------------------- |
| `npm run dev`   | Start Vite dev server  |
| `npm run build` | Production build       |
| `npm run preview` | Preview production build |
| `npm run lint`  | Run ESLint checks      |

## Environment Variables

| Name | Description |
| ---- | ----------- |
| `VITE_YOUTUBE_API_KEY` | YouTube Data API key used for fetching video metadata |
| `VITE_GEMINI_API_KEY`  | Google Gemini API key used for AI chat |

## License

This project is licensed under the MIT License. See [`LICENSE`](LICENSE) for details.
