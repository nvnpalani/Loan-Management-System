const express = require("express");
const cors = require("cors");
const path = require("path");
const db = require("./database/database");
const customerRoutes = require("./routes/customerRoutes");
const collectionRoutes = require("./routes/collectionRoutes");
const revenueRoutes = require("./routes/revenueRoutes");
const investorRoutes = require("./routes/investorRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const mobileRoutes = require("./routes/mobileRoutes");
const customerAppRoutes = require("./routes/customerAppRoutes");
const authRoutes = require("./routes/authRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const agentRoutes = require("./routes/agentRoutes");

const app = express();

app.use(cors());
app.use(express.json());

const uploadsPath = process.env.UPLOADS_PATH || path.join(__dirname, 'uploads');
app.use('/uploads', express.static(uploadsPath));
app.use(uploadRoutes);

app.use(customerRoutes);
app.use(collectionRoutes);

app.use(revenueRoutes);
app.use(investorRoutes);
app.use(mobileRoutes);
app.use(customerAppRoutes);
app.use(authRoutes);
app.use(dashboardRoutes);
app.use('/agent', agentRoutes);

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
}); 