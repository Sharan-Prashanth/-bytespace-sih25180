# Backend Server

This directory contains the backend application for the project, built with Node.js, Express, and MongoDB.

## Tech Stack

- **Runtime:** [Node.js](https://nodejs.org/)
- **Framework:** [Express](https://expressjs.com/)
- **Database:** [MongoDB](https://www.mongodb.com/) with [Mongoose](https://mongoosejs.com/)
- **Authentication:** [JSON Web Tokens (JWT)](https://jwt.io/)
- **Package Manager:** [pnpm](https://pnpm.io/)

## Folder Structure

```
server/
├── config/              # Configuration files (e.g., database connection)
├── controllers/         # Request handlers for different routes
├── middleware/          # Custom middleware (e.g., authentication, error handling)
├── models/              # Mongoose models for database schemas
├── routes/              # API route definitions
├── services/            # Business logic for services (e.g., email)
├── utils/               # Utility functions
├── server.js            # Main server entry point
└── ...
```

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- pnpm
- MongoDB connection string

### Installation

1.  Navigate to the `server` directory:
    ```bash
    cd server
    ```
2.  Install the dependencies:
    ```bash
    pnpm install
    ```
3.  Create a `.env` file in the `server` directory and add the following environment variables:
    ```
    NODE_ENV=development
    PORT=5000
    MONGO_URI=<your_mongodb_connection_string>
    JWT_SECRET=<your_jwt_secret>
    ```

### Running the Server

To start the server, run:

```bash
pnpm start
```

The API will be available at [http://localhost:5000](http://localhost:5000).

## API Endpoints

### Auth (`/api/auth`)

- `POST /login`: Log in a user.
- `POST /register`: Register a new user.
- `GET /me`: Get the profile of the currently logged-in user.
- `PUT /profile`: Update the profile of the currently logged-in user.
- `GET /staff`: Get a list of staff members (for reviewers).

### Proposals (`/api/proposals`)

- `POST /`: Create a new proposal.
- `GET /`: Get proposals for the current user.
- `GET /:id`: Get a specific proposal by ID.
- `PUT /:id`: Update a proposal.
- `POST /:id/feedback`: Add feedback to a proposal.
- `POST /:id/assign`: Assign a staff member to a proposal.
- `PUT /:id/status`: Update the status of a proposal.

## Database Models

- **User:** Represents a user of the application. Can have roles of `user`, `reviewer`, or `staff`.
- **Proposal:** Represents a research proposal submitted by a user.
- **Review:** Represents a review of a proposal.

## Authentication

Authentication is handled using JSON Web Tokens (JWT). The `protect` middleware is used to secure routes, and the `authorize` middleware is used to restrict access based on user roles.
