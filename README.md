# Twitter Clone (MERN Stack)

A full-stack Twitter clone built with MongoDB, Express, React, and Node.js. It supports user authentication, posting, likes and comments, following users, notifications, and profile customization.

## Features

- **Authentication:** JWT-based authentication using HTTP-only cookies.
- **Posts:** Create, delete, and view posts with text and images.
- **Interactions:** Like, unlike, and comment on posts.
- **Social graph:** Follow and unfollow users, with suggested users.
- **Profiles:** Update profile information, cover image, and profile picture.
- **Notifications:** Notifications for likes and follows.

## Tech Stack

| Layer    | Technologies                                                          |
| -------- | --------------------------------------------------------------------- |
| Frontend | React, Vite, Tailwind CSS, DaisyUI, TanStack React Query, React Router |
| Backend  | Node.js, Express 5, MongoDB (Mongoose), JWT, bcrypt                   |
| Storage  | Local file system (`multer` and `fs`) for image uploads               |

## Getting Started

### Prerequisites

- Node.js and npm
- A MongoDB connection string (local instance or MongoDB Atlas)

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/alibahja/Twitter-clone-MERN-stack-.git
   cd Twitter-clone-MERN-stack-
   ```

2. Install backend and frontend dependencies:

   ```bash
   npm install
   npm install --prefix frontend
   ```

3. Create a `.env` file in the project root:

   ```env
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   ```

   Do not set `NODE_ENV` in this file. The npm scripts set it automatically.

### Running Locally

Run the backend and frontend in separate terminals.

Backend:

```bash
npm run dev
```

Frontend:

```bash
cd frontend
npm run dev
```

The application is served at `http://localhost:3000`. The Vite dev server proxies `/api` and `/uploads` requests to the backend on port 8000.

## Image Storage

Uploaded images are written to a local `uploads/` directory on the server rather than to a cloud storage provider.

This works as expected in local development. On platforms with ephemeral file systems, such as Render, Railway, or Heroku, uploaded files are deleted whenever the server restarts or redeploys.

To persist images in production, replace the file system logic in `post.controller.js` and `user.controller.js` with a cloud storage service such as Cloudinary, AWS S3, Supabase Storage, or Cloudflare R2.

## Deployment

The repository is configured to deploy as a single service on Render, where the Express server serves the built React frontend from `frontend/dist`.

1. Create a new Web Service on Render and connect the GitHub repository.
2. Set the build command:

   ```bash
   npm run build
   ```

3. Set the start command:

   ```bash
   npm start
   ```

4. Add the `MONGO_URI` and `JWT_SECRET` environment variables in the Render dashboard.
5. Deploy.

Because of the ephemeral storage limitation described above, uploaded images will not persist across restarts.

## License

This project is released under the [ISC License](https://opensource.org/license/isc-license-txt).
