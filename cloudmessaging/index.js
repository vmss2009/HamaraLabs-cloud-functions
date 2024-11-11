const functions = require("firebase-functions");
const logger = require('firebase-functions/logger');
const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");
const express = require("express");
const cors = require("cors");

// Create and configure the Express app
const app = express();
app.use(cors({ origin: true })); // Enable CORS
app.use(express.json());

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// Define a POST route that accepts a string
app.post("/submit", async (req, res) => {
  const { FCMToken, title, body } = req.body;
    for (let i = 0; i < FCMToken.length; i++) {
      const payload = {
        token: FCMToken[i],
        notification: {
          title: title,
          body: body,
        },
      };
      logger.log(payload);
      await admin
        .messaging()
        .send(payload);
    }
    res.status(200).send({ status: 200, success: true});
});

// Export the Express app as a Firebase Cloud Function
exports.cloudmessaging = functions.https.onRequest(app);
