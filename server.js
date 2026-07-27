const express = require("express");
const cors = require("cors");
const supabase = require("./lib/db");
const rateLimit = require("express-rate-limit");

require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 4000;
const authRoutes = require("./routes/auth_routes");

app.set('trust proxy', 1);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 5, 
  standardHeaders: true, 
  legacyHeaders: false, 
  message: {
  status: 429,
  error: "Too many requests from this device. Please try again after 15 minutes."
  }
})

app.use(limiter);

app.use(cors());
app.use(express.json());
app.use("/api/auth_routes", authRoutes);

app.get("/", (req, res)=>{
    res.send("App is running!")
});

app.listen(PORT, ()=>{
    console.log(`App is running bro on port http://127.0.0.1:${PORT}`)
})

