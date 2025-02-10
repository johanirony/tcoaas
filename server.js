const express = require('express');
const Razorpay = require('razorpay');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();
const port = 3000; // Or any port you prefer

// Replace with your actual key ID and secret
const razorpay = new Razorpay({
    key_id: 'YOUR_KEY_ID',
    key_secret: 'YOUR_KEY_SECRET',
});

// Enable CORS for all origins (for development; restrict in production)
app.use(cors());

// Parse JSON request bodies
app.use(bodyParser.json());

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));
app.get('/', (req, res) => {
    console.log('Hello');
});
app.post('/', (req, res) => {
    console.log('Hello');
});

// Endpoint to create a Razorpay order
app.post('/create-order', async (req, res) => {
    try {
        // *Ideally*, get amount and other details from the request (req.body)
        //  For this example, we'll use a hardcoded amount.  In a real app,
        //  you'd likely have product information and calculate the amount here.
        const amount = 10000; // In paise (₹100)
        const currency = 'INR';

        const options = {
            amount: amount,
            currency: currency,
            receipt: 'order_rcptid_' + Date.now(), // Generate a unique receipt ID
        };

        const order = await razorpay.orders.create(options);

        //  In a real application, you would also store this order.id
        //  and associate it with your user/order in your database.

        res.json({
            success: true,
            orderId: order.id,
            amount: amount, // Send amount back to the client
            currency: currency // Send currency back
        });

    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ success: false, message: 'Error creating order' });
    }
});

// Endpoint to verify the payment
app.post('/verify-payment', async (req, res) => {
    try {
        const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;

        // Verify the signature
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const crypto = require('crypto');
        const expectedSignature = crypto.createHmac('sha256', razorpay.key_secret)
            .update(body.toString())
            .digest('hex');

        if (expectedSignature === razorpay_signature) {
            // Signature is valid.  Now fetch payment details from Razorpay.

            const payment = await razorpay.payments.fetch(razorpay_payment_id);

            if (payment.status === 'captured') {
                // Payment is successful
                // Update your database, mark order as paid, etc.

                res.json({ success: true, message: 'Payment verified and captured' });
            } else {
                // Payment is not captured (it might be authorized, failed, etc.)
                res.status(400).json({ success: false, message: 'Payment not captured' });
            }
        } else {
            // Signature is invalid
            res.status(400).json({ success: false, message: 'Invalid signature' });
        }
    } catch (error) {
        console.error('Error verifying payment:', error);
        res.status(500).json({ success: false, message: 'Error verifying payment' });
    }
});

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});