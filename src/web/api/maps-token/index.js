const { DefaultAzureCredential } = require("@azure/identity");

const MAPS_SCOPE = "https://atlas.microsoft.com/.default";

// Reuse the credential across warm invocations.
let credential;

module.exports = async function (context, req) {
  const headers = {
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
  };
  try {
    if (!credential) credential = new DefaultAzureCredential();
    const token = await credential.getToken(MAPS_SCOPE);
    context.res = {
      status: 200,
      headers,
      body: JSON.stringify({
        available: true,
        access_token: token.token,
        expires_on: Math.floor(token.expiresOnTimestamp / 1000),
      }),
    };
  } catch (err) {
    context.log.error("maps token error", err && err.message);
    context.res = {
      status: 503,
      headers,
      body: JSON.stringify({
        available: false,
        reason: `${err && err.name ? err.name : "Error"}: managed identity could not mint an Azure Maps token`,
      }),
    };
  }
};
