const functions = require("firebase-functions");
const express = require("express");
const cors = require("cors");
const axios = require('axios');
const crypto = require('crypto');
const { Buffer } = require('buffer');
const db = require("./firebase/firestore");
const auth = require("./firebase/auth");

require('dotenv').config()

const port = 3001

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

const Saltkey = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";
const SaltIndex = "x";

app.post("/initiateTransaction", async (req, res) => {
    const { merchantTransactionId, merchantUserId, amount, redirectUrl } = req.body;

    const merchantId = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";
    const newRedirectUrl = redirectUrl.replace('${merchantId}', merchantId);

    console.log(newRedirectUrl);

    const normalText = `{
    "merchantId": "${merchantId}",
    "merchantTransactionId": "${merchantTransactionId}",
    "merchantUserId": "${merchantUserId}",
    "amount": ${(amount*100).toString()},
    "redirectUrl": "${newRedirectUrl}",
    "redirectMode": "REDIRECT",
    "callbackUrl": "https://us-central1-hamaralabs-prod.cloudfunctions.net/paymentIntegration/submit",
    "mobileNumber": "9989875423",
    "paymentInstrument": {
        "type": "PAY_PAGE"
    }
    }`;

    const base64Text = Buffer.from(normalText).toString('base64');
    const sha256Hash = crypto.createHash('sha256');
    const modifiedText = base64Text.concat("/pg/v1/pay" + Saltkey);
    sha256Hash.update(modifiedText);
    let hashInHex = sha256Hash.digest('hex');
    hashInHex = hashInHex.concat("###" + SaltIndex);

    const options = {
    method: 'POST',
    url: 'https://api.phonepe.com/apis/hermes/pg/v1/pay',
    headers: {
        accept: 'application/json',
        'Content-Type': 'application/json',
        'X-VERIFY': hashInHex
    },
    data: {
        request: base64Text.toString()
    }
    };

    const request = await axios.request(options);
    const response = request.data;
    
    console.log(response.data.instrumentResponse.redirectInfo)

    res.status(200).send({ status: 200, success: true, url: response});

});

app.post("/getStatus", async (req, res) => {
    const { merchantId, merchantTransactionId } = req.body;

    let variableMerchantId = merchantId;

    if (merchantId === "{merchantId}") {
        variableMerchantId = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";
    }
    const string = `/pg/v1/status/${variableMerchantId}/${merchantTransactionId}` + Saltkey;
    const sha256Hash = crypto.createHash('sha256');
    sha256Hash.update(string);
    let hashInHex = sha256Hash.digest('hex');
    hashInHex = hashInHex.concat("###" + SaltIndex);

    const options = {
        method: 'GET',
        url: `https://api.phonepe.com/apis/hermes/pg/v1/status/${variableMerchantId}/${merchantTransactionId}`,
        headers: {
            accept: 'application/json',
            'Content-Type': 'application/json',
            'X-VERIFY': hashInHex,
            'X-MERCHANT-ID': `${variableMerchantId}`
        }
    }

    const request = await axios.request(options);
    console.log(request.data);

    return res.status(200).send({ status: 200, success: true, data: request.data });
});


app.post("/submit", async (req, res) => {
    const { response } = req.body;
    
    const responseStr = Buffer.from(response, 'base64').toString('utf8');
    const responseJson = JSON.parse(responseStr);

    console.log(responseJson);

    if (responseJson.code === "PAYMENT_SUCCESS") {
        await db.updateDoc("purchaseData", responseJson.data.merchantTransactionId, { status: "success" });
    } else {
        await db.deleteDoc("purchaseData", responseJson.data.merchantTransactionId, { status: "failed" });
    }

    res.status(200).send({ status: 200, success: true });
});

app.get("/referal-code", async (req, res) => {
    const doc = await db.getDoc("referalCodes", req.query.code);
    if(doc.data() !== undefined)
        res.json(doc.data());
    else
        res.json({error: "Invalid Referal Code"});
});

app.post("/addDoc" , async (req, res) => {
    const { collection, id, data } = req.body;

    if (id !== undefined || id !== null || id !== "") {
        await db.addDocWithId(collection, id, data);
    } else {
        await db.addDoc(collection, data);
    }

    res.status(200).send({ status: 200, success: true });
});

app.post("/getDoc", async (req, res) => {
    const { collection, id } = req.body;

    const doc = await db.getDoc(collection, id);

    res.status(200).send({ status: 200, success: true, data: doc.data() });
});

app.post("/createUser", async (req, res) => {
    const {email} = req.body;

    const user = await auth.createNewUser(email);
    if (user.error !== true) {
        console.log(user.error);
        res.status(200).send({ status: 200, success: true, user: user});
    } else {
        res.status(500).send({ status: 500, success: false, error: user });    
    }
});

app.post("/checkEmailExists", async (req, res) => {
    const { email } = req.body;

    const exists = await auth.checkEmailExists(email);

    res.status(200).send({ status: 200, success: true, exists: exists });
    
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

exports.paymentIntegration = functions.https.onRequest(app);
