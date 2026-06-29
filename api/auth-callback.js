export default async function handler(req, res) {
  const { code, error } = req.query;
  if (error) return res.redirect('/?auth_error=' + encodeURIComponent(error));
  if (!code) return res.redirect('/?auth_error=no_code');
  try {
    const clientId = process.env.OUTLOOK_CLIENT_ID;
    const clientSecret = process.env.OUTLOOK_CLIENT_SECRET;
    const tenantId = process.env.OUTLOOK_TENANT_ID;
    const redirectUri = 'https://commandcentre-eta.vercel.app/api/auth-callback';
    const tokenResponse = await fetch(
      `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          code,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
          scope: 'openid email profile Mail.Read Mail.ReadWrite Mail.Send offline_access'
        })
      }
    );
    const tokens = await tokenResponse.json();
    if (tokens.error) return res.redirect('/?auth_error=' + encodeURIComponent(tokens.error_description || tokens.error));
    const params = new URLSearchParams({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token || '',
      expires_in: tokens.expires_in || 3600
    });
    res.redirect(`/?outlook_auth=success&${params.toString()}`);
  } catch (err) {
    res.redirect('/?auth_error=' + encodeURIComponent(err.message));
  }
}
