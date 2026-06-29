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
    if (tokens.error) {
      return res.redirect('/?auth_error=' + encodeURIComponent(tokens.error_description || tokens.error));
    }
    // Store token in a cookie instead of URL param (tokens are too long for URLs)
    res.setHeader('Set-Cookie', [
      `outlook_token=${tokens.access_token}; Path=/; Max-Age=${tokens.expires_in || 3600}; SameSite=Lax`,
      `outlook_expiry=${Date.now() + ((tokens.expires_in || 3600) * 1000)}; Path=/; Max-Age=${tokens.expires_in || 3600}; SameSite=Lax`
    ]);
    res.redirect('/?outlook_auth=success');
  } catch (err) {
    res.redirect('/?auth_error=' + encodeURIComponent(err.message));
  }
}
