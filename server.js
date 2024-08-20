const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT ;

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI).then(() => {
    console.log('Connected to MongoDB');
}).catch(err => {
    console.error('Failed to connect to MongoDB', err);
});

// Middleware
app.use(express.json());
app.use(cors());
// Import routes
const analyticsRoutes = require('./routes/analytics.route');
app.use('/api/analytics', analyticsRoutes);

app.get("/",(req,res)=>{
    res.send("server is running!");
})
// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
