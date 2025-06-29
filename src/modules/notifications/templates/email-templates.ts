export interface EmailTemplateData {
  orderNumber: string;
  customerName?: string;
  totalAmount: number;
  customerEmail: string;
}

export const emailTemplates = {
  orderApproval: {
    subject: (data: EmailTemplateData) => `Order ${data.orderNumber} Approved - Payment Required`,
    html: (data: EmailTemplateData) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Order Approval</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9f9f9; }
        .payment-section { background-color: white; padding: 15px; margin: 15px 0; border-left: 4px solid #4CAF50; }
        .amount { font-size: 24px; font-weight: bold; color: #4CAF50; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
        .button { display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 Order Approved!</h1>
        </div>
        
        <div class="content">
            <p>Dear ${data.customerName || 'Valued Customer'},</p>
            
            <p>Great news! Your order has been approved and is ready for processing.</p>
            
            <div style="background-color: #e8f5e8; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <h3>Order Details:</h3>
                <p><strong>Order Number:</strong> ${data.orderNumber}</p>
                <p><strong>Total Amount:</strong> <span class="amount">TZS ${data.totalAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span></p>
            </div>
            
            <h3>Payment Options:</h3>
            
            <div class="payment-section">
                <h4>📱 Mobile Money Transfer</h4>
                <p><strong>Tigo Pesa:</strong></p>
                <ul>
                    <li>Lipa Number: <strong>123456</strong></li>
                    <li>Name: <strong>Spade</strong></li>
                </ul>
                
                <p><strong>Vodacom M-Pesa:</strong></p>
                <ul>
                    <li>Lipa Number: <strong>123456</strong></li>
                    <li>Name: <strong>Spade</strong></li>
                </ul>
            </div>
            
            <div class="payment-section">
                <h4>🏦 Bank Transfer</h4>
                <p><strong>CRDB Bank:</strong></p>
                <ul>
                    <li>Account Number: <strong>123456</strong></li>
                    <li>Account Name: <strong>Spade</strong></li>
                </ul>
                
                <p><strong>NMB Bank:</strong></p>
                <ul>
                    <li>Account Number: <strong>123456</strong></li>
                    <li>Account Name: <strong>Spade</strong></li>
                </ul>
            </div>
            
            <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;">
                <h4>📋 Important:</h4>
                <p>Once payment is completed, please share the confirmation via reply to this email or contact us through our official channels.</p>
            </div>
            
            <p>Thank you for choosing our services!</p>
            
            <p>Best regards,<br>
            <strong>The Spade Team</strong></p>
        </div>
        
        <div class="footer">
            <p>This is an automated message. Please do not reply to this email for payment confirmations.</p>
        </div>
    </div>
</body>
</html>`,
    text: (data: EmailTemplateData) => `
Dear ${data.customerName || 'Valued Customer'},

Great news! Your order has been approved and is ready for processing.

ORDER DETAILS:
Order Number: ${data.orderNumber}
Total Amount: TZS ${data.totalAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}

PAYMENT OPTIONS:

📱 Mobile Money Transfer:
Tigo Pesa:
  - Lipa Number: 123456
  - Name: Spade

Vodacom M-Pesa:
  - Lipa Number: 123456
  - Name: Spade

🏦 Bank Transfer:
CRDB Bank:
  - Account Number: 123456
  - Account Name: Spade

NMB Bank:
  - Account Number: 123456
  - Account Name: Spade

📋 Important: Once payment is completed, please share the confirmation via reply to this email or contact us through our official channels.

Thank you for choosing our services!

Best regards,
The Spade Team

---
This is an automated message. Please do not reply to this email for payment confirmations.`
  },

  orderStatusUpdate: {
    subject: (data: EmailTemplateData) => `Order ${data.orderNumber} Status Update`,
    html: (data: EmailTemplateData) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Order Status Update</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #2196F3; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9f9f9; }
        .status { font-size: 24px; font-weight: bold; color: #2196F3; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📋 Order Status Update</h1>
        </div>
        
        <div class="content">
            <p>Dear ${data.customerName || 'Valued Customer'},</p>
            
            <p>Your order status has been updated.</p>
            
            <div style="background-color: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <h3>Order Details:</h3>
                <p><strong>Order Number:</strong> ${data.orderNumber}</p>
                <p><strong>Total Amount:</strong> <span class="status">TZS ${data.totalAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span></p>
            </div>
            
            <p>Thank you for choosing our services!</p>
            
            <p>Best regards,<br>
            <strong>The Spade Team</strong></p>
        </div>
        
        <div class="footer">
            <p>This is an automated message.</p>
        </div>
    </div>
</body>
</html>`,
    text: (data: EmailTemplateData) => `
Dear ${data.customerName || 'Valued Customer'},

Your order status has been updated.

ORDER DETAILS:
Order Number: ${data.orderNumber}
Total Amount: TZS ${data.totalAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}

Thank you for choosing our services!

Best regards,
The Spade Team

---
This is an automated message.`
  }
}; 