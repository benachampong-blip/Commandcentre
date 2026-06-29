export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { access_token } = req.body;
  if (!access_token) return res.status(401).json({ error: 'No access token provided' });
  try {
    const response = await fetch(
      'https://graph.microsoft.com/v1.0/me/messages?$top=20&$orderby=receivedDateTime desc&$select=id,subject,from,receivedDateTime,bodyPreview,isRead,body',
      { headers: { 'Authorization': `Bearer ${access_token}`, 'Content-Type': 'application/json' } }
    );
    if (!response.ok) {
      const err = await response.json();
      return res.status(response.status).json({ error: err.error?.message || 'Failed to fetch emails' });
    }
    const data = await response.json();
    const emails = data.value || [];
    const skipKeywords = ['unsubscribe', 'newsletter', 'no-reply', 'noreply', 'marketing',
      'promotion', 'offer', 'deal', 'sale', 'discount', 'notification', 'automated',
      'do not reply', 'donotreply', 'info@', 'hello@', 'support@'];
    const important = emails.filter(e => {
      const subject = (e.subject || '').toLowerCase();
      const from = (e.from?.emailAddress?.address || '').toLowerCase();
      return !skipKeywords.some(k => subject.includes(k) || from.includes(k));
    });
    return res.status(200).json({
      emails: important.slice(0, 10).map(e => ({
        id: e.id,
        subject: e.subject || '(No subject)',
        from: e.from?.emailAddress?.name || e.from?.emailAddress?.address || 'Unknown',
        fromEmail: e.from?.emailAddress?.address || '',
        time: new Date(e.receivedDateTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
        date: new Date(e.receivedDateTime).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
        preview: e.bodyPreview || '',
        isRead: e.isRead,
        body: e.body?.content || ''
      }))
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
