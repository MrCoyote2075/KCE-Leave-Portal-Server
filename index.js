// Maximum Effort...

// Importing modules...
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { configDotenv } from "dotenv";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import rateLimit from 'express-rate-limit';
import AuthRouter from "./server/routers/auth.route.js";
import DB from "./server/connections/DB.connections.js";
import FormRouter from "./server/routers/form.route.js";
import AdminRouter from "./server/routers/admin.route.js";

// Configurations...
configDotenv();

// Connections...
DB.connect(process.env.MONGO_DB_URL);

const app = express();
const {NETWORK_IP, CLIENT_PORT, SERVER_PORT, CLIENT_URL} = process.env;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Security Middlewares...
app.use(helmet());
app.use(compression());
app.use(express.json({ limit: '16mb' }));

// Rate Limiter...
const globalLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 100,
    message: "Too many requests from this IP, please try again later.",
});
app.use(globalLimiter);

// Login endpoint limiter: 10 requests/min/IP
app.use("/api/login", rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 10,
    message: "Too many login attempts, please try again later.",
}));

// Apply leave endpoint limiter: 10 requests/min/IP
app.use("/api/apply-leave", rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 10,
    message: "Too many leave form submissions, please try again later.",
}));
// Logging...
app.use(morgan(process.env.STATUS === "development" ? "dev" : "combined"));

// Body Parsing & Cookie Parsing...
app.use(express.json());
app.use(cookieParser());

// CORS Configuration...
app.use(
    cors({
        origin:
            process.env.STATUS === "development"
                ? [`http://localhost:${CLIENT_PORT}`, `http://${NETWORK_IP}:${CLIENT_PORT}`]
                : CLIENT_URL,
        methods: ["GET", "POST", "PUT"],
        credentials: true,
    })
);

// Static Files Access...
app.use(express.static(path.join(__dirname, "public")));

// Routes...
app.get("/", (req, res) => res.send("Hello, World! From Backend"));

// Authentication Routes...
app.use("/auth", AuthRouter);

// Form Routes...
app.use("/api/form", FormRouter);

// Admin Routes...
app.use("/api/admin", AdminRouter);

// 404 Page Not Found...
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, "public", "404.html"));
});

app.use((err, req, res) => {
    console.error("Error occurred:", err.stack || err);
    res.status(500).json({
        success: false,
        message:
            process.env.STATUS === "development"
                ? err.message
                : "Internal Server Error",
    });
});

app.listen(SERVER_PORT, '0.0.0.0' , () => {
    console.log(`\n🚀 Server running at ${NETWORK_IP ? `http://${NETWORK_IP}:${SERVER_PORT}` : `http://localhost:${SERVER_PORT}`}`);
});

// #For Local Area Network Access

// Note : * Before Running This, Ensure the '.env' File, and Fill Your Ip Correctly
//        * Application Can Be Accessed Only When You Are In the Same Network,

// app.listen(PORT, '0.0.0.0', () => {
//     console.log(`Backend Server is Ready -> ${BACKEND_BASE_URL_NETWORK}`);
// });
