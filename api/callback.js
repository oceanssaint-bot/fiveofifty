// Vercel serverless function: completes the GitHub OAuth flow for Decap CMS.
// GitHub redirects here with ?code=...; we exchange it for an access token and
// hand it back to the CMS window using Decap's postMessage handshake.
// Requires env vars: OAUTH_GITHUB_CLIENT_ID, OAUTH_GITHUB_CLIENT_SECRET.
module.exports = async (req, res) => {
  const clientId = process.env.OAUTH_GITHUB_CLIENT_ID;
  const clientSecret = process.env.OAUTH_GITHUB_CLIENT_SECRET;
  const code = req.query && req.query.code;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');

  if (!clientId || !clientSecret) {
    return res.end(page('error', { error: 'Missing GitHub OAuth env vars on the server.' }));
  }
  if (!code) {
    return res.end(page('error', { error: 'No authorization code returned by GitHub.' }));
  }

  try {
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code }),
    });
    const data = await tokenRes.json();

    if (data.access_token) {
      res.end(page('success', { token: data.access_token, provider: 'github' }));
    } else {
      res.end(page('error', { error: data.error_description || 'Token exchange failed.' }));
    }
  } catch (e) {
    res.end(page('error', { error: String((e && e.message) || e) }));
  }
};

// Decap handshake: the popup announces itself, the CMS replies, then we post the
// result back to the CMS origin. See Decap external-OAuth provider spec.
function page(status, content) {
  const payload = JSON.stringify(content);
  return `<!doctype html><html><head><meta charset="utf-8"><title>Authorizing…</title></head>
<body><p>Authorizing…</p><script>
(function () {
  function receiveMessage(e) {
    window.opener.postMessage(
      'authorization:github:${status}:' + ${JSON.stringify(payload)},
      e.origin
    );
    window.removeEventListener('message', receiveMessage, false);
  }
  window.addEventListener('message', receiveMessage, false);
  window.opener && window.opener.postMessage('authorizing:github', '*');
})();
</script></body></html>`;
}
