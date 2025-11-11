# Frontend Client

This directory contains the frontend application for the project, built with Next.js and React.

## Tech Stack

- **Framework:** [Next.js](https://nextjs.org/)
- **Library:** [React](https://reactjs.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Rich Text Editor:** [Tiptap](https://tiptap.dev/)
- **Charts:** [Recharts](https://recharts.org/)
- **Package Manager:** [pnpm](https://pnpm.io/)

## Folder Structure

```
client/
├── public/              # Static assets
├── src/
│   ├── components/      # Reusable React components
│   ├── context/         # React context providers (e.g., AuthContext)
│   ├── pages/           # Next.js pages and API routes
│   ├── styles/          # Global and component-specific styles
│   └── utils/           # Utility functions (e.g., API helpers)
├── next.config.mjs      # Next.js configuration
├── postcss.config.mjs   # PostCSS configuration for Tailwind CSS
└── ...
```

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- pnpm

### Installation

1.  Navigate to the `client` directory:
    ```bash
    cd client
    ```
2.  Install the dependencies:
    ```bash
    pnpm install
    ```

### Running the Development Server

To start the development server, run:

```bash
pnpm dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

## Key Features

- **User Authentication:** Secure login and registration functionality.
- **Dashboard:** A central hub for users to view and manage their proposals.
- **Proposal Management:** Create, edit, and submit research proposals.
- **Rich Text Editor:** An advanced proposal editor powered by Tiptap for a seamless writing experience.
- **Profile Management:** Users can view and update their profile information.
- **AI Chatbot:** An integrated chatbot to assist users.
- **File Uploads:** Functionality to upload and attach documents to proposals.

## API Interaction

The frontend communicates with a backend API for data fetching and manipulation. The API base URL is configured in `src/utils/api.js` and proxied through the Next.js development server using rewrites in `next.config.mjs`. The production API endpoint is `https://sih25180.onrender.com`.
