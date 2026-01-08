# Deep Link Logic Documentation

## 1. Referral Tag Retention
**Goal:** Ensure the user's Affiliate Tag is never lost.

### Implementation:
1.  **Ingestion (`/api/shorten`):**
    -   When a link is created, we look for a `tag` in the input URL.
    -   If missing, we look at the User's Profile (`amazonTag`).
    -   This tag is saved permanently in the database (`ShortLinkData`).

2.  **Redirection (`DeepLinkRedirect.tsx`):**
    -   We retrieve the saved `tag` from the database.
    -   We append `?tag=YOUR_TAG` to **every** URL we construct (Web, iOS Scheme, Android Intent).

## 2. App Opening Strategy (Deep Linking)
**Goal:** Force the Amazon App to open, avoiding the browser login page.

### iOS Strategy:
-   **Primary:** Custom URL Scheme `com.amazon.mobile.shopping://`
-   **URL:** `com.amazon.mobile.shopping://www.amazon.{TLD}/products/{ASIN}?tag={TAG}`
-   **Fallback:** If the app isn't installed, we redirect to the Web URL after 2.5 seconds.
-   **Universal Link:** The Web URL (`https://www.amazon.com/...`) also acts as a Universal Link backup.

### Android Strategy:
-   **Primary:** Android Intent `intent://`
-   **Intent Definition:**
    ```
    intent://www.amazon.{TLD}/dp/{ASIN}?tag={TAG}#Intent;package=com.amazon.mShop.android.shopping;scheme=https;end
    ```
-   **Mechanism:** This explicitly targets the package `com.amazon.mShop.android.shopping`.
-   **Fallback:** If not installed, Android automatically falls back to the `scheme=https` behavior (opening the browser).

## 3. Geo-Targeting (Smart Redirect)
-   **Detection:** We use IP-based geolocation (`ipapi.co`) to find the user's country (e.g., Canada).
-   **Mapping:** We map the country to the correct Amazon domain (e.g., `amazon.ca`).
-   **Result:** A user in Canada clicking a US link is redirected to `amazon.ca/dp/{ASIN}?tag={TAG}`, preserving the session and account.
