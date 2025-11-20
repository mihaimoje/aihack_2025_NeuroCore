import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./connectionDb.js";

dotenv.config();

// Import routes
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import projectRoutes from "./routes/projects.js";
import taskRoutes from "./routes/tasks.js";
import teamRoutes from "./routes/teams.js";
import burnoutRoutes from "./routes/burnout.js";
import insightRoutes from "./routes/insights.js";
import invitationRoutes from "./routes/invitations.js";

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
connectDB();

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/burnout", burnoutRoutes);
app.use("/api/insights", insightRoutes);
app.use("/api/invitations", invitationRoutes);

// Health check
app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "Server is running" });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
