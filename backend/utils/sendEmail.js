const nodemailer = require('nodemailer');

const createTransporter = () => {
  return nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

/**
 * Send winner notification email
 * @param {string} to - Recipient email
 * @param {string} winnerName - Winner's name
 * @param {string} auctionTitle - Auction item title
 * @param {number} bidAmount - Winning bid amount
 */
const sendWinnerEmail = async (to, winnerName, auctionTitle, bidAmount) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('📧 Email not configured — skipping winner notification');
    return;
  }

  const transporter = createTransporter();

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Arial', sans-serif; background: #0d0118; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background: linear-gradient(135deg, #1a0533 0%, #0d1b2a 100%); border-radius: 16px; overflow: hidden; border: 1px solid rgba(124,58,237,0.3); }
        .header { background: linear-gradient(135deg, #7c3aed, #06b6d4); padding: 40px 30px; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 28px; letter-spacing: 1px; }
        .trophy { font-size: 60px; display: block; margin-bottom: 10px; }
        .body { padding: 40px 30px; color: #e2e8f0; }
        .body h2 { color: #7c3aed; margin-top: 0; }
        .auction-box { background: rgba(255,255,255,0.05); border: 1px solid rgba(124,58,237,0.3); border-radius: 12px; padding: 20px; margin: 20px 0; }
        .auction-box .label { color: #94a3b8; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; }
        .auction-box .title { color: #fff; font-size: 22px; font-weight: bold; margin: 5px 0; }
        .bid-amount { color: #06b6d4; font-size: 32px; font-weight: bold; }
        .footer { background: rgba(0,0,0,0.3); padding: 20px 30px; text-align: center; color: #64748b; font-size: 13px; }
        .btn { display: inline-block; background: linear-gradient(135deg, #7c3aed, #06b6d4); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <span class="trophy">🏆</span>
          <h1>Congratulations, ${winnerName}!</h1>
          <p style="color: rgba(255,255,255,0.8); margin: 5px 0;">You won the auction!</p>
        </div>
        <div class="body">
          <h2>You're the highest bidder!</h2>
          <p>Great news! The auction has ended and you've been declared the winner.</p>
          <div class="auction-box">
            <div class="label">Auction Item</div>
            <div class="title">${auctionTitle}</div>
            <div style="margin-top: 15px;">
              <div class="label">Your Winning Bid</div>
              <div class="bid-amount">₹${bidAmount.toLocaleString('en-IN')}</div>
            </div>
          </div>
          <p>Please log in to the Auction App to complete your purchase and arrange payment with the seller.</p>
          <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}" class="btn">Go to Auction App →</a>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Auction App. This is an automated message, please do not reply.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const mailOptions = {
    from: process.env.EMAIL_FROM || `Auction App <${process.env.EMAIL_USER}>`,
    to,
    subject: `🏆 You Won! "${auctionTitle}" – Your Bid of ₹${bidAmount.toLocaleString('en-IN')} is the Highest!`,
    html,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`📧 Winner email sent to ${to}`);
  } catch (error) {
    console.error(`📧 Failed to send email to ${to}:`, error.message);
  }
};

/**
 * Send seller notification email when their auction ends
 */
const sendSellerEmail = async (to, sellerName, auctionTitle, bidAmount, winnerName) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return;

  const transporter = createTransporter();

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; background: #0d0118; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background: linear-gradient(135deg, #1a0533 0%, #0d1b2a 100%); border-radius: 16px; overflow: hidden; border: 1px solid rgba(16,185,129,0.3); }
        .header { background: linear-gradient(135deg, #10b981, #06b6d4); padding: 40px 30px; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 26px; }
        .body { padding: 40px 30px; color: #e2e8f0; }
        .info-box { background: rgba(255,255,255,0.05); border: 1px solid rgba(16,185,129,0.3); border-radius: 12px; padding: 20px; margin: 20px 0; }
        .label { color: #94a3b8; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; }
        .value { color: #fff; font-size: 18px; font-weight: bold; margin: 5px 0 15px; }
        .amount { color: #10b981; font-size: 28px; font-weight: bold; }
        .footer { background: rgba(0,0,0,0.3); padding: 20px; text-align: center; color: #64748b; font-size: 13px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div style="font-size: 50px; margin-bottom: 10px;">🎉</div>
          <h1>Your Auction Has Ended!</h1>
        </div>
        <div class="body">
          <h2 style="color: #10b981; margin-top: 0;">Great news, ${sellerName}!</h2>
          <p>Your auction has successfully concluded with a winning bid.</p>
          <div class="info-box">
            <div class="label">Auction Item</div>
            <div class="value">${auctionTitle}</div>
            <div class="label">Winner</div>
            <div class="value">${winnerName}</div>
            <div class="label">Final Sale Price</div>
            <div class="amount">₹${bidAmount.toLocaleString('en-IN')}</div>
          </div>
          <p>Please coordinate with the winner to arrange payment and delivery.</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Auction App</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || `Auction App <${process.env.EMAIL_USER}>`,
      to,
      subject: `🎉 Your auction "${auctionTitle}" sold for ₹${bidAmount.toLocaleString('en-IN')}!`,
      html,
    });
    console.log(`📧 Seller email sent to ${to}`);
  } catch (error) {
    console.error(`📧 Failed to send seller email:`, error.message);
  }
};

module.exports = { sendWinnerEmail, sendSellerEmail };
