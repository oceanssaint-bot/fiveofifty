// Vercel serverless function: starts the GitHub OAuth flow for Decap CMS.
// Decap opens /api/auth in a popup; we bounce the user to GitHub to authorize.
// Requires env var: OAUTH_GITHUB_CLIENT_ID (set in the Vercel dashboard).
module.exports = (req, res) => {
  const clientId = process.env.OAUTH_GITHUB_CLIENT_ID;
  if (!clientId) {
    res.statusCode = 500;
    return res.end('Missing OAUTH_GITHUB_CLIENT_ID environment variable.');
  }

  const proto = req.headers['x-forwarded-proto'] || 'https';
  const redirectUri = `${proto}://${req.headers.host}/api/callback`;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: 'repo', // write access to the content repo
    state: Math.random().toString(36).slice(2),
  });

  res.statusCode = 302;
  res.setHeader('Location', `https://github.com/login/oauth/authorize?${params}`);
  res.end();
};
