# Google Auth Setup Guide

Follow these steps to create a Google Auth Client for your FounderFlow project:

### 1. Google Cloud Console
1.  Go to the **[Google Cloud Console](https://console.cloud.google.com/)**.
2.  Select your project: **founderflow-60e46**.
3.  Go to **APIs & Services** > **Credentials**.
4.  Click **+ CREATE CREDENTIALS** > **OAuth client ID**.
5.  If prompted, configure your **OAuth consent screen** first (select "External", add App Name, and User Support Email).
6.  For **Application type**, select **Web application**.

### 2. Enter URL & Redirect URIs
Add the following URLs exactly as shown:

**Authorized JavaScript origins:**
*   `http://localhost:3000`

**Authorized redirect URIs:**
*   `https://founderflow-60e46.firebaseapp.com/__/auth/handler`

### 3. Firebase Console
1.  Go to the **[Firebase Console](https://console.firebase.google.com/)**.
2.  Go to **Authentication** > **Sign-in method**.
3.  Click **Add new provider** > **Google**.
4.  Enable it and enter the **Web SDK configuration**:
    *   **Web client ID**: Paste the Client ID from Google Cloud Console.
    *   **Web client secret**: Paste the Client Secret from Google Cloud Console.
5.  Click **Save**.

### 4. Update .env.local
Ensure your `.env.local` has the correct client ID if you use it in the frontend, but usually Firebase handles this via the configuration you just saved in the console.
