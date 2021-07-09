//require('dotenv').config();
const express = require('express');
const path = require('path');
const https = require('https');
const qs = require('querystring');
const ejs = require('ejs');

const app = express()

// Middleware for body parsing
const parseUrl = express.urlencoded({ extended: false });
const parseJson = express.json({ extended: false });

// Set the view engine to ejs
// app.set('views', path.join(__dirname, 'views'));
// app.set('view engine', 'ejs');

const checksum_lib = require('./Paytm/checksum');
const config = require('./Paytm/config');
const { response } = require('express');

app.get('/payment', (req, res) => {
    //res.sendFile(path.join(__dirname + '/index.html'))
    res.render('first');
});


app.get('/subscribe', function(req, res) {
    if (!req.user) {
        res.status(400).send('Unvalid User');
    } else {
        var params = {};
        params['MID'] = process.env.M_ID;
        params['WEBSITE'] = process.env.WEBSITE;
        params['CHANNEL_ID'] = 'WEB';
        params['INDUSTRY_TYPE_ID'] = 'Retail';
        params['ORDER_ID'] = 'TEST_' + new Date().getTime();
        params['CUST_ID'] = 'customer_001';
        params['TXN_AMOUNT'] = '200';
        params['CALLBACK_URL'] = 'http://localhost:3000/callback';
        params['EMAIL'] = req.user.username;



        checksum_lib.genchecksum(params, process.env.MK, function(err, checksum) {
            var txn_url = "https://securegw-stage.paytm.in/theia/processTransaction"; // for staging
            // var txn_url = "https://securegw.paytm.in/theia/processTransaction"; // for production

            var form_fields = "";
            for (var x in params) {
                form_fields += "<input type='hidden' name='" + x + "' value='" + params[x] + "' >";
            }
            form_fields += "<input type='hidden' name='CHECKSUMHASH' value='" + checksum + "' >";

            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.write('<html><head><title>Merchant Checkout Page</title></head><body><center><h1>Please do not refresh this page...</h1></center><form method="post" action="' + txn_url + '" name="f1">' + form_fields + '</form><script type="text/javascript">document.f1.submit();</script></body></html>');
            res.end();
        });
    }
});


app.post('/paynow', [parseUrl, parseJson], (req, res) => {
    if (!req.body.amount || !req.body.email || !req.body.phone) {
        res.status(400).send('Payment failed');
    } else {
        var params = {};
        params['MID'] = process.env.M_ID;
        params['WEBSITE'] = process.env.WEBSITE;
        params['CHANNEL_ID'] = 'WEB';
        params['INDUSTRY_TYPE_ID'] = 'Retail';
        params['ORDER_ID'] = 'TEST_' + new Date().getTime();
        params['CUST_ID'] = 'customer_001';
        params['TXN_AMOUNT'] = req.body.amount.toString();
        params['CALLBACK_URL'] = 'http://localhost:3000/callback';
        params['EMAIL'] = req.body.email;
        params['MOBILE_NO'] = req.body.phone.toString();


        checksum_lib.genchecksum(params, process.env.MK, function(err, checksum) {
            var txn_url = "https://securegw-stage.paytm.in/theia/processTransaction"; // for staging
            // var txn_url = "https://securegw.paytm.in/theia/processTransaction"; // for production

            var form_fields = "";
            for (var x in params) {
                form_fields += "<input type='hidden' name='" + x + "' value='" + params[x] + "' >";
            }
            form_fields += "<input type='hidden' name='CHECKSUMHASH' value='" + checksum + "' >";

            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.write('<html><head><title>Merchant Checkout Page</title></head><body><center><h1>Please do not refresh this page...</h1></center><form method="post" action="' + txn_url + '" name="f1">' + form_fields + '</form><script type="text/javascript">document.f1.submit();</script></body></html>');
            res.end();
        });
    }
})

app.post('/callback', (req, res) => {
    console.log("callback");
    var body = '';

    req.on('data', function(data) {
        body += data;
    });
    console.log("req on");
    req.on('end', function() {
        console.log("inside req on");
        var html = "";
        var post_data = qs.parse(body);

        // received params in callback
        console.log('Callback Response: ', post_data, "\n");


        // verify the checksum
        var checksumhash = post_data.CHECKSUMHASH;
        // delete post_data.CHECKSUMHASH;
        var result = checksum_lib.verifychecksum(post_data, process.env.MK, checksumhash);
        console.log("Checksum Result => ", result, "\n");


        // Send Server-to-Server request to verify Order Status
        var params = { "MID": process.env.M_ID, "ORDERID": post_data.ORDERID };

        checksum_lib.genchecksum(params, config.PaytmConfig.key, function(err, checksum) {

            params.CHECKSUMHASH = checksum;
            post_data = 'JsonData=' + JSON.stringify(params);

            var options = {
                hostname: 'securegw-stage.paytm.in', // for staging
                // hostname: 'securegw.paytm.in', // for production
                port: 443,
                path: '/merchant-status/getTxnStatus',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Content-Length': post_data.length
                }
            };


            // Set up the request
            var response = "";
            var post_req = https.request(options, function(post_res) {
                post_res.on('data', function(chunk) {
                    response += chunk;
                });

                post_res.on('end', function() {
                    //console.log('S2S Response: ', response, "\n");

                    // var _result = JSON.parse(response);
                    //console.log("Status: ", _result.STATUS);
                    // res.render('response', {
                    //     'data': _result
                    // })
                    res.redirect('/payment_response/' + response);
                });
            });

            // post the data
            post_req.write(post_data);
            post_req.end();
        });
    });
});

module.exports = app;