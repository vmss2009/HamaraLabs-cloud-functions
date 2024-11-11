const admin = require("firebase-admin");

const serviceAccount = require("./serviceAccountKey.json");

const app = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

module.exports = app;