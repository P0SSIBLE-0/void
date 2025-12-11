# Void
![Void Banner](/public/opengraph-image.png)

[Live Demo](https://insidevoid.vercel.app/)

> **Throw it into the Void.**
> Capture first, organize later. A private, intelligent digital sanctuary that remembers everything so you don't have to.

## 🌌 Overview

Void is a minimalist, AI-powered second brain designed to reduce cognitive load. Instead of worrying about where to file a link, note, or image, you simply "throw it into the Void." Our intelligent system uses Google Gemini AI to automatically categorize, tag, and organize your content, keeping your digital space uncluttered and your mind clear.

## ✨ Features

-   **🚀 Instant Capture**: Save links, thoughts, and images in milliseconds.
-   **🧠 AI Auto-Organization**: Content is automatically analyzed, tagged, and categorized using comprehensive AI models.
-   **🎨 Beautiful Masonry Grid**: A responsive, aesthetically pleasing interface to browse your digital life.
-   **🌗 Dark/Light Mode**: Seamless theme switching with a premium design system.
-   **📱 Fully Responsive**: A unified experience across desktop and mobile devices.
-   **🔍 Deep Search**: Find anything by context, even if you don't remember the exact keywords.
-   **🔒 Secure**: Authentication and data storage powered by Supabase.

## 🛠️ Tech Stack

-   **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
-   **Language**: [TypeScript](https://www.typescriptlang.org/)
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
-   **Animations**: [Motion](https://motion.dev/) (Framer Motion)
-   **Database & Auth**: [Supabase](https://supabase.com/)
-   **AI**: [Google Gemini](https://deepmind.google/technologies/gemini/)
-   **Icons**: [Lucide React](https://lucide.dev/)

## 📸 Previews

![Dashboard](/public/dashboard.png)

![CardPreview](/public/card-preview.png)

## 🚀 Getting Started

### Prerequisites

-   Node.js 18+
-   npm or pnpm

### Installation

1.  **Clone the repository**

    ```bash
    git clone git@github.com:P0SSIBLE-0/void.git
    cd void
    ```

2.  **Install dependencies**

    ```bash
    npm install
    # or
    pnpm install
    ```

3.  **Set up Environment Variables**

    Create a `.env.local` file in the root directory and add your credentials:

    ```env
    SCRAPINGANT_API_KEY=your_scrapingant_api_key
    DATABASE_URL=your_database_url from supabase
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
    GEMINI_API_KEY=your_gemini_api_key
    ```

4.  **Run the development server**

    ```bash
    npm run dev
    ```

    Open [http://localhost:3000](http://localhost:3000) to view the application.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1.  Fork the project
2.  Create your feature branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
