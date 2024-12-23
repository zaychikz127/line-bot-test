const express = require('express');
const mysql = require('mysql'); // นำเข้า MySQL
const router = express.Router();

// ตั้งค่า LINE API
const CHANNEL_ACCESS_TOKEN = "9UyQhYQR/Zn5h4ZHTu6zYqxMG0vNWXk3oCwKp5O0sfjNbJiXlE/GwgDp69aRFEW9+5xydhLU58n2WCSfKRKopCZ2wDtFdFmdLoR8VfigtfXy58bK5rdCu5NJpi8tFqYInYinU7xf0HQFghjm8J5bVwdB04t89/1O/w1cDnyilFU=";
const LINE_API_URL = "https://api.line.me/v2/bot/message/reply";

// ตั้งค่าการเชื่อมต่อ MySQL
const db = mysql.createConnection({
    host: "45.91.133.140",
    port: 3306,
    user: "line-bot-test",
    password: "linebot123",
    database: "line-bot-test"
});

// เชื่อมต่อกับฐานข้อมูล
db.connect(err => {
    if (err) {
        console.error("Error connecting to the database:", err.message);
    } else {
        console.log("TEST-BOT : Connected to the MySQL database.");
    }
});

// Route สำหรับดึงข้อมูลจากตาราง `users`
router.get('/data', (req, res) => {
    const query = "SELECT * FROM users"; // Query สำหรับตาราง users

    db.query(query, (err, results) => {
        if (err) {
            console.error("Error fetching data from database:", err.message);
            res.status(500).json({ error: "Failed to fetch data from database." });
        } else {
            res.status(200).json({ data: results }); // ส่งข้อมูลกลับในรูปแบบ JSON
        }
    });
});

// Route สำหรับตรวจสอบ coop_code และดึงข้อมูล id ที่เกี่ยวข้อง
router.get('/coop/:coop_code', (req, res) => {
    const { coop_code } = req.params; // รับค่าจากพารามิเตอร์ URL
    const query = `
        SELECT id, name, coop_code 
        FROM coop 
        WHERE coop_code = ?
    `;

    db.query(query, [coop_code], (err, results) => {
        if (err) {
            console.error("Error checking coop_code:", err.message);
            res.status(500).json({ error: "Failed to check coop_code in the database." });
        } else if (results.length === 0) {
            res.status(404).json({ message: "coop_code not found." });
        } else {
            res.status(200).json({ data: results }); // ส่งข้อมูลกลับในรูปแบบ JSON
        }
    });
});

// Route สำหรับ webhook
router.post('/login/webhook', (req, res) => {
    const event = req.body;

    // Extract ข้อมูลจาก LINE Webhook
    const replyToken = event.events[0]?.replyToken;
    const message = event.events[0]?.message?.text;

    // เช็คข้อความที่ผู้ใช้ส่งมา
    if (message.startsWith("coop_code:")) {
        const coopCode = message.split(":")[1].trim(); // รับค่า coop_code จากข้อความ

        // ตรวจสอบว่า coop_code มีอยู่ในฐานข้อมูลหรือไม่
        getCoopData(coopCode, (err, coopData) => {
            if (err) {
                sendReply(replyToken, "Error occurred while checking coop_code.");
            } else if (!coopData) {
                sendReply(replyToken, "coop_code not found.");
            } else {
                // ส่งข้อมูลของสหกรณ์กลับไป
                const responseMessage = `Welcome! You are logged in to the coop: ${coopData.name}.\nID: ${coopData.id}\nDate: ${coopData.date}`;
                sendReply(replyToken, responseMessage);
            }
        });
    } else {
        sendReply(replyToken, "Hello! Please provide your coop_code to log in.");
    }

    res.sendStatus(200); // ตอบกลับ LINE Webhook
});

// ฟังก์ชันสำหรับตรวจสอบ coop_code ในฐานข้อมูล
function getCoopData(coopCode, callback) {
    const query = "SELECT id, name FROM coop WHERE coop_code = ?"; // Query สำหรับ table coop
    db.query(query, [coopCode], (err, results) => {
        if (err) {
            console.error("Error fetching coop data from database:", err);
            callback(err, null);
        } else if (results.length === 0) {
            callback(null, null); // coop_code ไม่พบในฐานข้อมูล
        } else {
            callback(null, results[0]); // คืนข้อมูลของสหกรณ์
        }
    });
}

// ฟังก์ชันส่งข้อความกลับไปที่ LINE API
function sendReply(replyToken, text) {
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CHANNEL_ACCESS_TOKEN}`
    };

    const payload = {
        replyToken,
        messages: [{ type: "text", text }]
    };

    axios.post(LINE_API_URL, payload, { headers })
        .then(response => {
            console.log("Reply sent:", response.data);
        })
        .catch(error => {
            console.error("Error sending reply:", error.response?.data || error.message);
        });
}

module.exports = router;
