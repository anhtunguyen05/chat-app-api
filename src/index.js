require('dotenv').config();

const express = require('express')
const cors = require('cors')

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

app.get('/', (req, res) => {
  res.send('Hello World!')
})

// Route
route(app);

app.listen(process.env.PORT || 5000, () => console.log("Server running on port 5000"));
