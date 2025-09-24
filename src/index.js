require('dotenv').config();

const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser');

const app = express()

const route = require("./routes");
const db = require('./config/database')

//Connect to database
db.connect();

//CORS
app.use(cors({
  origin: "http://localhost:3000", // hoặc "*" cho dev
  credentials: true                // bật nếu dùng cookie
}));

//Middleware
app.use(express.urlencoded());
app.use(express.json());
app.use(cookieParser());

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.get("/api/auth/me", (req, res) => {
  console.log("raw cookie header:", req.headers.cookie);
  console.log("parsed cookies:", req.cookies);
  res.json({ cookies: req.cookies || null });
});

// Route
route(app);

app.listen(process.env.PORT || 5000, () => console.log("Server running on port 5000"));
