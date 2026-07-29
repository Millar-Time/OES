"""Azure Maps token endpoint.

The browser never holds a map key. It requests a short-lived Entra access token
for the Azure Maps resource, minted here using the app's managed identity
(DefaultAzureCredential). Locally this uses your `az login` identity.
"""
from __future__ import annotations

from typing import Any

MAPS_SCOPE = "https://atlas.microsoft.com/.default"


def get_maps_token() -> dict[str, Any]:
    """Return an Entra token for Azure Maps, or a clear error if unavailable.

    Never raises to the caller with secrets; returns a structured payload the
    front end can act on. Requires the Azure Maps account (F3) + an identity
    with the Azure Maps Data Reader role.
    """
    try:
        from azure.identity import DefaultAzureCredential
    except ImportError:
        return {"available": False, "reason": "azure-identity not installed"}

    try:
        credential = DefaultAzureCredential(exclude_interactive_browser_credential=False)
        token = credential.get_token(MAPS_SCOPE)
        return {"available": True, "access_token": token.token, "expires_on": token.expires_on}
    except Exception as exc:  # noqa: BLE001 - surface a safe, non-secret reason
        return {"available": False, "reason": f"{type(exc).__name__}: run 'az login' or provision Azure Maps (F3)"}
