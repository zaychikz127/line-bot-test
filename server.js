const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
app.use(bodyParser.json()); // สำหรับ parse JSON requests

// MySQL Database connection
const db = mysql.createConnection({
    host: "45.91.133.140",
    port: 3306,
    user: "greenhouse-it-msu",
    password: "abc123greenhouse",
    database: "greenhouse-it-msu"
});

// เชื่อมต่อฐานข้อมูล
db.connect(err => {
    if (err) {
        console.error("Error connecting to the database:", err);
    } else {
        console.log("Connected to the MySQL database.");
    }
});

// LINE API settings
const LINE_API_URL = "https://api.line.me/v2/bot/message/reply";
const CHANNEL_ACCESS_TOKEN = "9UyQhYQR/Zn5h4ZHTu6zYqxMG0vNWXk3oCwKp5O0sfjNbJiXlE/GwgDp69aRFEW9+5xydhLU58n2WCSfKRKopCZ2wDtFdFmdLoR8VfigtfXy58bK5rdCu5NJpi8tFqYInYinU7xf0HQFghjm8J5bVwdB04t89/1O/w1cDnyilFU=";

// ฟังก์ชันดึงข้อมูลจาก table test
function getDataFromTest(callback) {
    const query = "SELECT id, name, date FROM test"; // Query สำหรับ table test
    db.query(query, (err, results) => {
        if (err) {
            console.error("Error fetching data from the database:", err);
            callback(err, null);
        } else {
            callback(null, results);
        }
    });
}

// Webhook route
app.post('/webhook', (req, res) => {
    const event = req.body;

    // Extract user ID และ message
    const userId = event.events[0].source.userId;
    const message = event.events[0]?.message?.text;
    const replyToken = event.events[0]?.replyToken; // ดึง replyToken จาก event

    // ตัวอย่าง: ถ้าผู้ใช้ส่ง "get_test_data"
    if (message === "get_test_data") {
        getDataFromTest((err, data) => {
            let responseMessage = "No data found.";

            if (!err && data.length > 0) {
                // Format ข้อมูลที่ดึงจากฐานข้อมูล
                responseMessage = data.map(row => `ID: ${row.id}, Name: ${row.name}, Date: ${row.date}`).join("\n");
            }

            // ส่งข้อความตอบกลับผู้ใช้
            sendReply(replyToken, responseMessage);
        });
    }

    res.sendStatus(200); // ตอบกลับ LINE Webhook
});

// GET endpoint เพื่อดึงข้อมูลจาก table test
app.get('/test-data', (req, res) => {
    getDataFromTest((err, data) => {
        if (err) {
            console.error("Error fetching data:", err);
            res.status(500).json({ error: "Failed to fetch data from database." });
        } else {
            // ส่งข้อมูลกลับในรูปแบบ JSON
            res.json({ data });
        }
    });
});


// ฟังก์ชันส่งข้อความกลับไปที่ LINE
function sendReply(replyToken, text) {
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CHANNEL_ACCESS_TOKEN}`
    };

    const payload = {
        replyToken: replyToken,
        messages: [{ type: "text", text: text }]
    };

    axios.post(LINE_API_URL, payload, { headers })
        .then(response => {
            console.log("Reply sent:", response.data);
        })
        .catch(error => {
            console.error("Error sending reply:", error.response?.data || error.message);
        });
}

// กำหนด port ที่ต้องการ
const PORT = 5000;

// เริ่มเซิร์ฟเวอร์
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}.`);
});
