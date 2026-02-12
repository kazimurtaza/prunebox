# Google OAuth 2.0 Setup Guide for Prunebox

This guide will walk you through setting up Google OAuth 2.0 credentials for the Prunebox application.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Create a Google Cloud Project](#create-a-google-cloud-project)
3. [Enable the Gmail API](#enable-the-gmail-api)
4. [Configure OAuth Consent Screen](#configure-oauth-consent-screen)
5. [Create OAuth 2.0 Credentials](#create-oauth-20-credentials)
6. [Configure Environment Variables](#configure-environment-variables)
7. [Test the Setup](#test-the-setup)
8. [Troubleshooting](#troubleshooting)
9. [Production Deployment](#production-deployment)

---

## Prerequisites

Before you begin, make sure you have:

- A Google account (Gmail or Google Workspace)
- Access to [Google Cloud Console](https://console.cloud.google.com/)
- Your local development environment running on `http://localhost:3000`

---

## Create a Google Cloud Project

### Step 1: Go to Google Cloud Console

1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Sign in with your Google account
3. Click on the project dropdown in the top left
4. Click **"NEW PROJECT"**

### Step 2: Configure Your Project

1. **Project Name**: Enter `Prunebox` (or your preferred name)
2. **Location**: Select **"No organization"** (or your organization if applicable)
3. Click **"CREATE"**

### Step 3: Select Your Project

1. Wait for the project to be created (may take a minute)
2. Use the project dropdown to select your newly created project

---

## Enable the Gmail API

### Step 1: Navigate to API Library

1. In the left sidebar, go to **APIs & Services** > **Library**
2. Search for **"Gmail API"**
3. Click on **"Gmail API"** in the results

### Step 2: Enable the API

1. Click the **"ENABLE"** button
2. Wait for the API to be enabled (you'll see a green checkmark)

---

## Configure OAuth Consent Screen

### Step 1: Create OAuth Consent Screen

1. In the left sidebar, go to **APIs & Services** > **OAuth consent screen**
2. Choose **"External"** (for testing) or **"Internal"** (if using Google Workspace)
3. Click **"CREATE"**

### Step 2: Fill in App Information

Complete the following fields:

| Field | Value |
|-------|-------|
| **App name** | `Prunebox` |
| **User support email** | Your email address |
| **Developer contact email** | Your email address |
| **Logo** | (Optional) Upload a 128x128px logo |

### Step 3: Configure Scopes

1. Click **"ADD OR REMOVE SCOPES"**
2. Add the following scopes **one by one** by searching and selecting:

   ```
   openid
   email
   profile
   https://www.googleapis.com/auth/gmail.readonly
   https://www.googleapis.com/auth/gmail.modify
   https://www.googleapis.com/auth/gmail.labels
   https://www.googleapis.com/auth/gmail.send
   ```

3. Click **"UPDATE"** to save the scopes
4. Click **"SAVE AND CONTINUE"**

### Step 4: Add Test Users (External Only)

1. Add your Google email address as a test user
2. Click **"SAVE AND CONTINUE"**

### Step 5: Summary

1. Review your consent screen configuration
2. Click **"BACK TO DASHBOARD"**

---

## Create OAuth 2.0 Credentials

### Step 1: Create Credentials

1. In the left sidebar, go to **APIs & Services** > **Credentials**
2. Click the **"+ CREATE CREDENTIALS"** dropdown
3. Select **"OAuth client ID"**

### Step 2: Select Application Type

1. Choose **"Web application"** as the application type

### Step 3: Configure Your OAuth Client

#### Name
- Enter: `Prunebox Web Client`

#### Authorized JavaScript origins
Add the following for development:
```
http://localhost:3000
```

For production, add:
```
https://yourdomain.com
```

#### Authorized redirect URIs
Add the following **exactly** (this is critical):

For development:
```
http://localhost:3000/api/auth/callback/google
```

For production:
```
https://yourdomain.com/api/auth/callback/google
```

### Step 4: Create and Save

1. Click **"CREATE"**
2. **Important**: Copy the **Client ID** and **Client Secret** immediately
3. Save these values - you'll need them for your `.env` file

---

## Configure Environment Variables

### Step 1: Open Your .env File

```bash
# In your project root
nano .env
# or
code .env
# or your preferred editor
```

### Step 2: Update the Following Variables

Replace the placeholder values with your actual credentials:

```bash
# Google OAuth - Replace with your actual credentials
GOOGLE_CLIENT_ID="your-actual-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-actual-client-secret"

# NextAuth - Ensure this matches your dev URL
NEXTAUTH_URL="http://localhost:3000"

# Generate a secure secret with:
# openssl rand -base64 32
NEXTAUTH_SECRET="generate-this-with-openssl"
```

### Step 3: Generate NEXTAUTH_SECRET

If you haven't already, generate a secure secret:

```bash
openssl rand -base64 32
```

Copy the output and paste it as the `NEXTAUTH_SECRET` value.

### Step 4: Save and Restart

1. Save the `.env` file
2. Restart your development server:

```bash
npm run dev
```

---

## Test the Setup

### Step 1: Visit Your App

1. Open your browser to `http://localhost:3000`
2. Click **"Sign in with Google"**

### Step 2: Authorize the App

1. You may see an **"Unverified App"** warning (this is normal for development)
2. Click **"Advanced"**
3. Click **"Go to Prunebox (unsafe)"** or **"Go to Prunebox (development)"**
4. Review the permissions and click **"Allow"**

### Step 3: Verify Login

- If successful, you should be redirected to the dashboard
- You should see your Google profile information

### Step 4: Check Console Logs

In your terminal, you should see logs like:

```
JWT Callback { hasUser: true, hasAccount: true }
Session Callback { hasToken: true }
```

---

## Troubleshooting

### Error: "The OAuth client was not found" (401 invalid_client)

**Cause**: Invalid Client ID or Client Secret

**Solution**:
1. Verify your `GOOGLE_CLIENT_ID` matches exactly in Google Cloud Console
2. Verify your `GOOGLE_CLIENT_SECRET` matches exactly
3. Check for extra spaces or quotes in your `.env` file
4. Ensure you restarted your dev server after updating `.env`

### Error: "redirect_uri_mismatch"

**Cause**: Redirect URI doesn't match what's configured in Google Cloud Console

**Solution**:
1. Go to **APIs & Services** > **Credentials**
2. Edit your OAuth 2.0 client
3. Verify the **Authorized redirect URIs** includes exactly:
   ```
   http://localhost:3000/api/auth/callback/google
   ```
4. **Note**: The URI must include `/api/auth/callback/google` at the end
5. Common mistake: Using `/api/auth/callback` instead of `/api/auth/callback/google`

### Error: "Unverified App" Warning

**Cause**: Your app hasn't been verified by Google

**Solution**:
- This is normal for development
- Only test users can sign in (add yourself in OAuth consent screen)
- For production, complete [Google's app verification process](https://support.google.com/cloud/answer/13463644)

### Error: "Access Blocked: App is in testing mode"

**Cause**: Your email isn't added as a test user

**Solution**:
1. Go to **APIs & Services** > **OAuth consent screen**
2. Click **"TEST USERS"**
3. Add your Google email address
4. Sign in with that email address

### Error: "Requested scopes not granted"

**Cause**: Scopes weren't added to the OAuth consent screen

**Solution**:
1. Go to **APIs & Services** > **OAuth consent screen**
2. Click **"EDIT APP"**
3. Go to **Scopes** section
4. Ensure all Gmail scopes are added

---

## Required Scopes Reference

| Scope | Purpose | Permission Level |
|-------|---------|------------------|
| `openid` | User's sign-in ID | Basic |
| `email` | User's email address | Basic |
| `profile` | User's profile info | Basic |
| `gmail.readonly` | Read emails for subscription detection | Restricted |
| `gmail.modify` | Move/delete/label emails | Restricted |
| `gmail.labels` | Create custom labels | Restricted |
| `gmail.send` | Send digest emails | Restricted |

**Note**: All Gmail scopes are "Restricted" and require Google's verification for production use beyond 100 test users.

---

## Production Deployment

### Update Google Cloud Console for Production

1. Go to **APIs & Services** > **Credentials**
2. Edit your OAuth 2.0 client
3. Add production URIs:

**Authorized JavaScript origins:**
```
https://yourdomain.com
```

**Authorized redirect URIs:**
```
https://yourdomain.com/api/auth/callback/google
```

### Update Production Environment Variables

```bash
NEXTAUTH_URL="https://yourdomain.com"
NEXT_PUBLIC_APP_URL="https://yourdomain.com"
```

### Google App Verification (Required for Public Launch)

For production with more than 100 users:
1. Complete Google's [OAuth app verification](https://support.google.com/cloud/answer/13463644)
2. This requires:
   - Privacy policy page
   - Terms of service page
   - Security assessment questionnaire
   - $15-75 verification fee

---

## Quick Reference Card

### Development Environment Variables

```bash
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-generated-secret"
```

### Required Redirect URI

```
http://localhost:3000/api/auth/callback/google
```

### Required Scopes

```
openid email profile gmail.readonly gmail.modify gmail.labels gmail.send
```

---

## Additional Resources

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Gmail API Documentation](https://developers.google.com/gmail/api)
- [NextAuth.js Google Provider](https://next-auth.js.org/providers/google)
- [Google Cloud Console](https://console.cloud.google.com/)

---

## Next Steps

After completing this setup:

1. ✅ Test sign-in flow
2. ✅ Verify Gmail access tokens are stored
3. ✅ Test subscription scanning functionality
4. ✅ Review and update your production configuration
5. ✅ Consider Google app verification for production launch

---

**Still having issues?** Check the [troubleshooting section](#troubleshooting) or review the [project documentation](../README.md).
