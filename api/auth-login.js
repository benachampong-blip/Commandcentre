export default function handler(req, res) {
  const clientId = process.env.OUTLOOK_CLIENT_ID;
  const tenantId = process.env.OUTLOOK_TENANT_ID;
  const redirectUri = encodeURIComponent('https://commandcentre-eta.vercel.app/api/auth-callback');
  const scope = encodeURIComponent('openid email profile Mail.Read Mail.ReadWrite Mail.Send offline_access');
  const authUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&scope=${scope}&response_mode=query`;
  res.redirect(authUrl);
}
