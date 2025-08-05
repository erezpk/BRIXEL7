import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic } from "./vite";
import cors from "cors";

const app = express();
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? false : true,
  credentials: true
}));

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    const method = req.method;
    const url = req.url;

    let logMessage = `${method} ${url} ${status}`;
    if (duration > 0) {
      logMessage += ` in ${duration}ms`;
    }

    // Add response body for error cases
    if (status >= 400) {
      logMessage += ` :: ${JSON.stringify(res.locals.errorBody || {})}`;
    }

    console.log(`${new Date().toLocaleTimeString()} [express] ${logMessage}`);
  });

  next();
});

// Capture response body for error logging
app.use((req: Request, res: Response, next: NextFunction) => {
  const originalJson = res.json;
  res.json = function(body) {
    if (res.statusCode >= 400) {
      res.locals.errorBody = body;
    }
    return originalJson.call(this, body);
  };
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    if (res.headersSent) {
      return;
    }

    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    console.error(err);
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    console.log(`serving on port ${port}`);
  });
})();