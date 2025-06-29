# Customer Notification System

## Overview

This system automatically sends notifications to customers when their orders are approved and ready for payment. Currently, the system supports SMS notifications since customers have phone numbers but no email addresses.

## How It Works

### 1. Order Approval Flow

When an order is approved, the system automatically:

1. **Updates the order status** to `APPROVED`
2. **Sends internal notifications** to relevant staff (managers, order managers)
3. **Sends customer notification** via SMS to the customer's phone number

### 2. Notification Types

#### SMS Notifications (Primary)
- **Trigger**: Order status changes to `APPROVED`
- **Recipients**: Customer's phone number
- **Message**: Includes order number, total amount, and payment instructions
- **Example**: "Dear Customer, your order ORD-2024-001 has been approved! Total amount: TZS 500,000. You can now proceed with payment. Thank you for choosing our services."

#### Email Notifications (Future Enhancement)
- **Trigger**: Order status changes to `APPROVED` (if customer has email)
- **Recipients**: Customer's email address
- **Content**: Detailed order information with payment instructions

### 3. Supported Order Types

#### Regular Orders (`/orders`)
- **Customer Contact**: Uses `phoneNumber` field from the order
- **Notification**: Sent when status changes to `APPROVED`
- **Endpoint**: `PATCH /orders/:orderNumber/status`

#### Chicken Orders (`/chicken-orders`)
- **Customer Contact**: Uses `phone` field from the chicken order
- **Notification**: Sent when `receivingStatus` changes to `APPROVED`
- **Endpoint**: `PATCH /chicken-orders/:id/receiving-status`

## Implementation Details

### Files Modified

1. **`src/modules/notifications/notifications.service.ts`**
   - Added `sendOrderApprovalSMS()` method
   - Added `sendOrderApprovalEmail()` method
   - Added `sendCustomerOrderApprovalNotification()` method

2. **`src/modules/orders/orders.service.ts`**
   - Updated `sendStatusUpdateNotifications()` to send customer notifications

3. **`src/modules/customers/chicken-orders.service.ts`**
   - Added `updateReceivingStatus()` method
   - Added `sendReceivingStatusNotifications()` method

4. **`src/modules/customers/chicken-orders.controller.ts`**
   - Added `PATCH /:id/receiving-status` endpoint

5. **`src/modules/customers/customers.module.ts`**
   - Added `NotificationsModule` import

### SMS Service Integration

Currently, the system logs SMS messages to the console. To integrate with a real SMS service:

1. **Install SMS service package** (e.g., Twilio, Africa's Talking)
2. **Update the `sendOrderApprovalSMS()` method** in `notifications.service.ts`
3. **Add SMS service credentials** to environment variables

Example with Twilio:
```typescript
// In sendOrderApprovalSMS method
const client = new twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
await client.messages.create({
  body: message,
  from: process.env.TWILIO_PHONE_NUMBER,
  to: customerPhone
});
```

### Email Service Integration

To integrate with an email service:

1. **Install email service package** (e.g., SendGrid, AWS SES)
2. **Update the `sendOrderApprovalEmail()` method** in `notifications.service.ts`
3. **Add email service credentials** to environment variables

Example with SendGrid:
```typescript
// In sendOrderApprovalEmail method
const msg = {
  to: customerEmail,
  from: process.env.SENDGRID_FROM_EMAIL,
  subject: subject,
  text: message,
};
await sgMail.send(msg);
```

## Testing

### Test Order Approval
1. Create an order with a phone number
2. Update order status to `APPROVED`
3. Check console logs for SMS notification

### Test Chicken Order Approval
1. Create a chicken order with a phone number
2. Update receiving status to `APPROVED`
3. Check console logs for SMS notification

## Error Handling

- **SMS/Email failures** don't break the order approval process
- **Errors are logged** to console for debugging
- **Missing phone numbers** are handled gracefully (no notification sent)

## Future Enhancements

1. **Add email field** to customer entities
2. **Integrate with real SMS service** (Twilio, Africa's Talking)
3. **Add notification preferences** (SMS, Email, or both)
4. **Add notification history** tracking
5. **Add retry logic** for failed notifications
6. **Add notification templates** for different order types 