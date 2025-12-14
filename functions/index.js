const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();
const db = admin.firestore();

// Optional providers
const sgMail = require('@sendgrid/mail');
const Twilio = require('twilio');

// Read API keys from env variables set with `firebase functions:config:set`
const SENDGRID_API_KEY = functions.config().sendgrid?.key || process.env.SENDGRID_API_KEY;
const TWILIO_SID = functions.config().twilio?.sid || process.env.TWILIO_SID;
const TWILIO_TOKEN = functions.config().twilio?.token || process.env.TWILIO_TOKEN;
const TWILIO_FROM = functions.config().twilio?.from || process.env.TWILIO_FROM;

if (SENDGRID_API_KEY) sgMail.setApiKey(SENDGRID_API_KEY);
let twilioClient = null;
if (TWILIO_SID && TWILIO_TOKEN) twilioClient = Twilio(TWILIO_SID, TWILIO_TOKEN);

// Helper to fetch cita data
async function getCita(citaId) {
  const doc = await db.collection('citas').doc(citaId).get();
  if (!doc.exists) throw new Error('Cita no encontrada');
  return { id: doc.id, ...doc.data() };
}

// Send email via SendGrid
async function sendEmail(to, subject, text, html) {
  if (!sgMail) throw new Error('SendGrid no configurado');
  const msg = { to, from: 'no-reply@yourclinic.example.com', subject, text, html };
  return sgMail.send(msg);
}

// Send SMS/WhatsApp via Twilio
async function sendSms(to, body, viaWhatsApp = false) {
  if (!twilioClient) throw new Error('Twilio no configurado');
  const toNumber = viaWhatsApp ? `whatsapp:${to}` : to;
  return twilioClient.messages.create({ body, from: viaWhatsApp ? `whatsapp:${TWILIO_FROM}` : TWILIO_FROM, to: toNumber });
}

// Callable function: sendReminder
// Payload: { citaId, when (ms timestamp), channel: 'email'|'sms'|'whatsapp' }
exports.sendReminder = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Debe autenticarse');
  const { citaId, when, channel } = data;
  if (!citaId) throw new functions.https.HttpsError('invalid-argument', 'Falta citaId');

  const cita = await getCita(citaId);
  const sendAt = Number(when) || Date.now();

  // If sendAt is in the future, create a reminder doc; a scheduled function should process reminders
  if (sendAt > Date.now() + 5000) {
    await db.collection('reminders').add({ citaId, userId: cita.userId, sendAt: admin.firestore.Timestamp.fromMillis(sendAt), channel: channel || 'email', createdAt: admin.firestore.FieldValue.serverTimestamp(), status: 'scheduled' });
    return { status: 'scheduled' };
  }

  // Immediate send
  try {
    const messageText = `Recordatorio: Tiene una cita el ${cita.date} a las ${cita.time} con el doctor ${cita.doctor}.`; 
    if (channel === 'email') {
      if (!SENDGRID_API_KEY) throw new functions.https.HttpsError('failed-precondition', 'SendGrid no configurado');
      await sendEmail(cita.email, 'Recordatorio de cita', messageText, `<p>${messageText}</p>`);
      return { status: 'sent', channel: 'email' };
    }
    if (channel === 'sms') {
      if (!twilioClient) throw new functions.https.HttpsError('failed-precondition', 'Twilio no configurado');
      await sendSms(cita.phone, messageText, false);
      return { status: 'sent', channel: 'sms' };
    }
    if (channel === 'whatsapp') {
      if (!twilioClient) throw new functions.https.HttpsError('failed-precondition', 'Twilio no configurado');
      await sendSms(cita.phone, messageText, true);
      return { status: 'sent', channel: 'whatsapp' };
    }
    // Default: email
    if (SENDGRID_API_KEY) {
      await sendEmail(cita.email, 'Recordatorio de cita', messageText, `<p>${messageText}</p>`);
      return { status: 'sent', channel: 'email' };
    }
    throw new functions.https.HttpsError('unavailable', 'No hay transportes de notificación configurados');
  } catch (err) {
    console.error('Error enviando recordatorio:', err);
    throw new functions.https.HttpsError('internal', err.message || 'Error');
  }
});

// OPTIONAL: a scheduled function to process reminders stored in Firestore
exports.processReminders = functions.pubsub.schedule('every 5 minutes').onRun(async (context) => {
  const now = admin.firestore.Timestamp.now();
  const snap = await db.collection('reminders').where('sendAt', '<=', now).where('status', '==', 'scheduled').limit(50).get();
  if (snap.empty) return null;
  const promises = [];
  snap.forEach(doc => {
    const r = doc.data();
    promises.push((async () => {
      try {
        const cita = await getCita(r.citaId);
        const messageText = `Recordatorio: Tiene una cita el ${cita.date} a las ${cita.time}.`;
        if (r.channel === 'sms' && twilioClient) await sendSms(cita.phone, messageText, false);
        else if (r.channel === 'whatsapp' && twilioClient) await sendSms(cita.phone, messageText, true);
        else if (SENDGRID_API_KEY) await sendEmail(cita.email, 'Recordatorio de cita', messageText, `<p>${messageText}</p>`);
        await doc.ref.update({ status: 'sent', sentAt: admin.firestore.FieldValue.serverTimestamp() });
      } catch (err) {
        console.error('Error procesando recordatorio', err);
        await doc.ref.update({ status: 'error', error: String(err) });
      }
    })());
  });
  await Promise.all(promises);
  return null;
});
