const express = require("express");
const app = express();
const CryptoJS = require("crypto-js");
const bodyParser = require('body-parser');
const { default: Axios } = require("axios");
const axios = require('axios');
const res = require("express/lib/response");
const { redirect } = require("express/lib/response");

const urlencodedParser = bodyParser.urlencoded({ extended: false })


app.post('/', urlencodedParser, function(req,res,next) {
    let client_secret = 'XXXXXXXXX';
    let data = req.body.data;


    let encryption_key = CryptoJS.enc.Utf8.parse(client_secret.substr(0, 16));
    let base64_original = data.replace(/-/g, '+').replace(/_/g, '/');
    let buff = Buffer.from(base64_original, 'base64');
    let iv = buff.slice(0, 16);
    let payload = buff.slice(16);

    let decryptedData = CryptoJS.AES.decrypt(payload.toString('base64'), encryption_key,
    { iv: CryptoJS.enc.Hex.parse(iv.toString('hex')) });

    let json = JSON.parse(decryptedData.toString(CryptoJS.enc.Utf8));
    
    console.log(json);

    let storeId = json.storeId;
    let returnUrl = json.returnUrl;
    let transaction = json.cart.order.referenceTransactionId;
    let orderNumber = json.cart.order.orderNumber;
    let token = json.token;


    axios.put("https://app.ecwid.com/api/v3/" + storeId + "/orders/" + transaction + "?token=" + token + "", {
        "paymentStatus": "PAID"
    });

    function getStatusAndReturn() {
        axios.get("https://app.ecwid.com/api/v3/" + storeId + "/orders/" + orderNumber + "?token=" + token) 
        .then(function (response) {
            var status = response.data.paymentStatus;
            console.log('Order status is ' + status);
    
            if (status == 'PAID' || status == 'AWAITING_PAYMENT'){
                res.redirect(returnUrl);
                console.log('Returned successfully');
            } else {
                res.redirect(returnUrl + "&errorMsg=Error%20occured.%20Try%20again%20later.")
                console.log('Failed to return')
            }
        });
    };
    setTimeout(getStatusAndReturn, 3000);


});


app.listen(80, function () {
    console.log('App is listening on port 80');
  });
