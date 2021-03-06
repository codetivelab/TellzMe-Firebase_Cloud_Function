const functions = require("firebase-functions");
const express = require("express");
const app = express();
const admin = require("firebase-admin");
admin.initializeApp();
const cors = require('cors')({origin: true});

const Stripe = require("stripe");
const stripe = Stripe(
  "sk_test_51IK0ryFiEatvCdLGJDpWhMGhMRxRDbhoB9mOFXZpC88Pg6a7JAI1b1kJp1H9PrXQS7yOF8z5xzIx5H6z1m0mvCYM00A85BW07i"
);

app.use(cors);

app.post("/connection_token", async (req, res) => {
  const token = res.json({ secret: token.secret }); // ... Fetch or create the ConnectionToken
});
app.post("/create_customer", async (req, res) => {
  if (req.body.email != null) {
    const customer = await stripe.customers.create({
      email: req.body.email,
    });

    if (customer != null && customer.id != null) {
      res.json({ customer: customer.id, status: "success" });
    } else {
      res.json({
        msg: "Please contact admin. Unable to create customer.",
        status: "failure",
      });
    }
  } else {
    res.json({ msg: "Please provide email", status: "failure" });
  }
});

app.post("/ephemeralKey", async (req, res) => {
  if (req.body.api_version == null || req.body.customer_id == null) {
    res.json({ msg: "Unable to create emhemeral key.", status: "failure" });
  } else {
    let key = await stripe.ephemeralKeys.create(
      { customer: req.body.customer_id },
      { apiVersion: req.body.api_version }
    );
    if (key != null) res.json({ data: key });
    else {
      res.json({ msg: "Unable to create emhemeral key.", status: "failure" });
    }
  }
});

app.get("/apidata", (req, res) => {
  const date = new Date();
  const hours = (date.getHours() % 12) + 1; // London is UTC + 1hr;
  res.json({ msg: "hello world" });
});


app.get('/create-checkout-session', async (req, res) => {

  if(req.query.price_id != null && req.query.mode != null) {
  await stripe.checkout.sessions.create({
    line_items: [
      {
        // Provide the exact Price ID (for example, pr_1234) of the product you want to sell
        price: req.query.price_id,
        quantity: 1,
      },
    ],
    success_url: 'https://example.com/success',
   cancel_url : 'https://example.com/cancel' ,
    mode: req.query.mode,
  }).then(
           function(result) {
            res.json({ msg: "Success", status: "success" , session: result});
           },
           function(err) {
            res.json({ msg: "error", status: "error" , session: err});
           }
         );

  
   
 } else {
  if(req.query.price_id == null)

  return { success: false, msg: 'Please provide Price ID' };
  else 
  return { success: false, msg: 'Please provide Payment mode' };
}

  res.redirect(303, session.url);
});
app.get("/account", async (req, res) => {
  // const account = await stripe.accounts.create({ type: "express" });
  // res.json({ account: account});
  // try {

    const account = await stripe.accounts.create({
      country: 'US',
      type: 'express',
      capabilities: {
        card_payments: {requested: true},
        transfers: {requested: true},
      },
      business_type: 'individual',
      
      business_profile:{product_description: 'Tellzme will use this account url to transfer payments into the Contractor account. Contractor will be providing services to the clients and will get paid using stripe.'} ,
    });

   

const accountLink = await stripe.accountLinks.create({
  account: account.id,
  refresh_url: 'https://example.com/reauth',
  return_url: 'https://example.com/success',
  type: 'account_onboarding',
});


res.json({ account: account, link: accountLink});

});

app.post("/sendFCM", async (req, res) => {
  var isSuccess = false;
  if (
    req.body.tokens == null ||
    req.body.tokens.length == 0 ||
    req.body.msg == null ||
    req.body.title == null
  ) {
    if (req.body.title == null)
      res.json({ msg: "Msg Title Required", status: "failure" });
    if (req.body.msg == null)
      res.json({ msg: "Message Required", status: "failure" });
    if (req.body.tokens == null)
      res.json({ msg: "FCM Tokens Required", status: "failure" });
    if (req.body.tokens.length == 0)
      res.json({ msg: "FCM Tokens Required", status: "failure" });
  } else {
    req.body.tokens.forEach((element) => {
      if(element != ""){
      const payload = {
        token: element,
        notification: {
          title: req.body.title,
          body: req.body.msg,
        },
        data: {
          body: req.body.msg,
        },
      };

      admin
        .messaging()
        .send(payload)
        .then((response) => {
          // Response is a message ID string.
          console.log("Successfully sent message:", response);
          isSuccess = true;
          // return { success: true };
        })
        .catch(function(error) {
          console.log("Notification sent failed:", error);
          isSuccess = false;
          // res.json({ msg: "Notification sent failed", status: "failure" });
          // return { success: false };
        });
      }else{
      isSuccess=false;
      }
    });
  
  }

  if (isSuccess == true) {
    res.json({ msg: "Success", status: "success" });
  } else {
    res.json({ msg: "Failed", status: "failed" });
  }
  return { success: true };
});
app.post("/createPaymentIntent", async (req, res) => {
  if (req.body.amount == null || req.body.customer_id == null) {
    res.json({ msg: "Amount Required", status: "failure" });
  } else {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: req.body.amount,
      currency: "usd",
    });
    const clientSecret = paymentIntent.client_secret;

    const data = { paymentIntent: paymentIntent, clientSecret: clientSecret };

    res.json({ data: data });
  }
});

app.post("/refund", async (req, res) => {
  if (req.body.amount == null || req.body.payment_intent == null) {
    res.json({ msg: "Amount and Payment Intent Required", status: "failure" });
  } else {

const refund = await stripe.refunds.create({
  payment_intent: eq.body.payment_intent,
  amount: req.body.amount,
});

    res.json({ data: refund });
}
});

app.post("/payout", async (req, res) => {
  if (req.body.amount == null || req.body.stripe_account_id == null) {
    res.json({ msg: "Amount and Stripe Account ID Required", status: "failure" });
  } else {

    const payout = await stripe.payouts.create({
      amount: req.body.amount,
      currency: 'usd',
    }, {
      stripeAccount: req.body.stripe_account_id,
    });

    res.json({ data: payout });
}
});




// Set your secret key. Remember to switch to your live secret key in production.
// See your keys here: https://dashboard.stripe.com/apikeys


// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//   functions.logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
exports.app = functions.https.onRequest(app);
