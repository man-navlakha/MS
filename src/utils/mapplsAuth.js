// utils/mapplsAuth.js
export async function getMapplsAccessToken() {
  const client_id = "96dHZVzsAuueso7A3CYajjqyHQQhN8vZtyilN1_xm4pFsUugQD5f8mORTn2Sjwqxnk-2rkCkR4SJxqPYQTRG-Q==";
  const client_secret = "this-is-clienlrFxI-iSEg-xGWX1ollcfHxdWlc_t78E3GSVZSZUx25bsD-tisf1FwrCwVWGLRV0R_2UAHNWrPq9SvkKjk_V5Jtk5pgLfDP_t-secret-provided-to-client";
  const tokenUrl = "https://outpost.mappls.com/api/security/oauth/token";

  try {
    const res = await fetch(tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id,
        client_secret,
      }),
    });

    if (!res.ok) {
      throw new Error(`Token request failed: ${res.status}`);
    }

    const data = await res.json();
    console.log("✅ Mappls token received:", data);
    return `${data.token_type} ${data.access_token}`;
  } catch (err) {
    console.error("❌ Failed to get Mappls token:", err);
    return null;
  }
}
