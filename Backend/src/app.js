import express from "express"
import mongoose from "mongoose"
import cors from "cors"
import cookieParser from "cookie-parser"
import expressStatusMonitor from "express-status-monitor"
import ApiResponse from "./utils/ApiResponse.js"
import asyncHandler from "./utils/asyncHandler.js"
import ResumeRouter from "./routes/resume.routes.js"
import AuthRouter from "./routes/auth.routes.js"
import ChatRouter from "./routes/chat.routes.js"
import pdfRoutes from "./routes/pdf.routes.js"
import templateRoutes from "./routes/template.routes.js"
import AdminRouter from "./routes/admin.routes.js"
import agentRoutes from "./routes/agent.routes.js";

const app = express()
app.use(expressStatusMonitor({ path: '/dashboard' }))
app.use(express.json({ limit: "500kb" }))
app.use(cookieParser())
app.use("/pdfs", express.static("pdfs"))

const corsOptions = {
    origin: ["http://localhost:5173", "https://agentic-resume.vercel.app"],
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS', 'PUT', 'PATCH'],
    allowedHeaders: ['Content-type', 'Authorization', 'Cookie'],
    credentials: true
}

app.use(cors(corsOptions))

async function getStats() {
    const startTime = Date.now();
    const result = await mongoose.connection.db.command({ ping: 1 })
    const endTime = Date.now()
    const latency = endTime - startTime

    const isMongoConnected = mongoose.connection.readyState == 1;
    const statusInfo = {
        status: "OK",
        mongoDB: isMongoConnected ? "Connected" : "Disconnected",
        latency: latency + "ms",
        timetamp: new Date(),
    }
    return statusInfo
}

app.get(/\/.*\/status$/, asyncHandler(async (req, res) => {
    const statusInfo = await getStats()
    res.status(200).json(statusInfo);
}));

app.get("/", async (req, res) => {
    const statusInfo = await getStats();
    res.status(200).json(new ApiResponse(200, statusInfo, "Server is Live"))
})

app.use("/api/resume", ResumeRouter)
app.use("/api/auth", AuthRouter)
app.use("/api/chat", ChatRouter)
app.use("/api/pdf", pdfRoutes);
app.use("/api/template", templateRoutes)
app.use("/api/admin", AdminRouter)
app.use("/api/agent", agentRoutes);

export default app