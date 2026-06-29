export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { access_token, to, subject, body, reply_to_id } = req.body;
  if (!access_token) return res.status(401).json({ error: 'No access token' });
  try {
    let url, payload;
    if (reply_to_id) {
      url = `https://graph.microsoft.com/v1.0/me/messages/${reply_to_id}/reply`;
      payload = { message: { body: { contentType: 'Text', content: body } } };
    } else {
      url = 'https://graph.microsoft.com/v1.0/me/sendMail';
      payload = {
        message: {
          subject,
          body: { contentType: 'Text', content: body },
          toRecipients: [{ emailAddress: { address: to } }]
        }
      };
    }
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${access_token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (response.status === 202 || response.status === 200) return res.status(200).json({ success: true });
    const err = await response.json();
    return res.status(response.status).json({ error: err.error?.message || 'Failed to send' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
