const { test } = require('node:test');
const assert = require('assert');
const meetingModel = require('../src/models/meetingModel');
const meetingController = require('../src/controllers/meetingController');

function makeRes() {
  return {
    statusCode: 200,
    payload: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.payload = body; return this; },
  };
}

test('meeting payment requires a signature when Razorpay is configured', async () => {
  const originalSecret = process.env.RAZORPAY_KEY_SECRET;
  const originalFindById = meetingModel.findById;
  const originalSetPaid = meetingModel.setBookingFeePaid;
  let markedPaid = false;

  process.env.RAZORPAY_KEY_SECRET = 'test-secret';
  meetingModel.findById = async () => ({
    id: 'meeting-1',
    customer_id: 'customer-1',
    booking_fee_order_id: 'order-1',
    booking_fee_status: 'UNPAID',
  });
  meetingModel.setBookingFeePaid = async () => { markedPaid = true; };

  try {
    const req = {
      user: { id: 'customer-1' },
      body: {
        meeting_id: 'meeting-1',
        razorpay_order_id: 'order-1',
        razorpay_payment_id: 'payment-1',
      },
    };
    const res = makeRes();
    await meetingController.verifyPayment(req, res);

    assert.strictEqual(res.statusCode, 400);
    assert.strictEqual(markedPaid, false);
  } finally {
    process.env.RAZORPAY_KEY_SECRET = originalSecret;
    meetingModel.findById = originalFindById;
    meetingModel.setBookingFeePaid = originalSetPaid;
  }
});
