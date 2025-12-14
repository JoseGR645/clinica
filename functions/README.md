This folder contains example Cloud Functions for sending reminders via SendGrid (email) and Twilio (SMS/WhatsApp).

Setup (basic):
1. Install dependencies inside this folder:

   npm install

2. Configure environment variables for SendGrid and Twilio (recommended via Firebase config):

   firebase functions:config:set sendgrid.key="YOUR_SENDGRID_KEY"
   firebase functions:config:set twilio.sid="YOUR_TWILIO_SID" twilio.token="YOUR_TWILIO_TOKEN" twilio.from="+1234567890"

3. Deploy functions:

   firebase deploy --only functions

Notes:
- The callable `sendReminder` supports immediate sends or scheduling. If `when` is in the future it creates a `reminders` Firestore document and `processReminders` (a scheduled function) will process pending reminders.
- For Gmail direct sending via the user's Gmail account, you would need OAuth on server-side; SendGrid is simpler for transactional emails.
- Twilio supports both SMS and WhatsApp (via `whatsapp:+number`). Ensure your Twilio account is configured for WhatsApp if needed.
