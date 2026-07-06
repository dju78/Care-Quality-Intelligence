// Vercel serverless entry — re-exports the Express app as the request handler.
// The server module runs initSchema()/seedIfEmpty() on cold start (into /tmp on
// Vercel) and does not bind a port when process.env.VERCEL is set.
export { default } from "../server/src/index.js";
