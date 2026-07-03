import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { dbService } from '@/lib/dbWrapper';
import { signToken } from '@/lib/jwt';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const code = searchParams.get('code');
    const state = searchParams.get('state') || '/';
    const redirectParam = searchParams.get('redirect') || '/';

    // Determine current App URL dynamically from request headers if env is placeholder/missing
    const host = req.headers.get('host') || 'localhost:3000';
    const protocol = host.includes('localhost') || host.includes('127.0.0.1') ? 'http' : 'https';
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || `${protocol}://${host}`;

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    // Check if Google Client credentials are set
    const hasGoogleKeys = clientId && clientSecret && !clientId.includes('your-google-client-id');

    if (!code) {
      // Step 1: Redirect to Google Consent screen or mock it
      if (!hasGoogleKeys) {
        console.warn("⚠️ [Google OAuth] GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET is missing. Falling back to simulated login.");
        // Simulated Google OAuth profile details
        const googleProfile = {
          name: "Arthur Pendragon",
          email: "arthur.google@nexcart.luxury",
          image: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80",
        };

        // Find or create user
        let user = await dbService.getUserByEmail(googleProfile.email);
        if (!user) {
          user = await dbService.createUser({
            name: googleProfile.name,
            email: googleProfile.email,
            image: googleProfile.image,
            role: 'CUSTOMER',
          });
          
          await dbService.createAuditLog({
            userId: user.id,
            action: "USER_REGISTER_OAUTH",
            details: `User ${user.email} registered via Google OAuth (SIMULATED).`
          });
        } else {
          await dbService.createAuditLog({
            userId: user.id,
            action: "USER_LOGIN_OAUTH",
            details: `User ${user.email} logged in via Google OAuth (SIMULATED).`
          });
        }

        const token = signToken({
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        });

        const cookieStore = await cookies();
        cookieStore.set('nexcart_session', token, {
          httpOnly: true,
          secure: (process.env.NODE_ENV as string) === 'production',
          sameSite: 'strict',
          maxAge: 60 * 60 * 24, // 1 day
          path: '/'
        });

        return NextResponse.redirect(new URL(redirectParam, req.url));
      }

      // Real flow: redirect to Google accounts server
      const callbackUrl = `${appUrl}/api/auth/google`;
      const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(callbackUrl)}&response_type=code&scope=openid%20email%20profile&state=${encodeURIComponent(redirectParam)}`;
      
      return NextResponse.redirect(googleAuthUrl);
    }

    // Step 2: Callback exchange authorization code for access token
    const callbackUrl = `${appUrl}/api/auth/google`;
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId!,
        client_secret: clientSecret!,
        redirect_uri: callbackUrl,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("❌ [Google OAuth] Token exchange failed:", errorText);
      return NextResponse.redirect(new URL('/login?error=OAuthTokenExchangeFailed', req.url));
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Step 3: Retrieve profile user info using the access token
    const profileResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!profileResponse.ok) {
      console.error("❌ [Google OAuth] Profile fetch failed");
      return NextResponse.redirect(new URL('/login?error=OAuthProfileFetchFailed', req.url));
    }

    const googleProfile = await profileResponse.json(); // contains email, name, picture
    const email = googleProfile.email;
    const name = googleProfile.name || email.split('@')[0];
    const image = googleProfile.picture || null;

    if (!email) {
      console.error("❌ [Google OAuth] Email missing from profile details");
      return NextResponse.redirect(new URL('/login?error=OAuthEmailMissing', req.url));
    }

    // Find or create user
    let user = await dbService.getUserByEmail(email);
    if (!user) {
      user = await dbService.createUser({
        name,
        email,
        image,
        role: 'CUSTOMER',
      });

      await dbService.createAuditLog({
        userId: user.id,
        action: "USER_REGISTER_OAUTH",
        details: `User ${user.email} registered via Google OAuth (REAL).`
      });
    } else {
      await dbService.createAuditLog({
        userId: user.id,
        action: "USER_LOGIN_OAUTH",
        details: `User ${user.email} logged in via Google OAuth (REAL).`
      });
    }

    const token = signToken({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    });

    const cookieStore = await cookies();
    cookieStore.set('nexcart_session', token, {
      httpOnly: true,
      secure: (process.env.NODE_ENV as string) === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24, // 1 day
      path: '/'
    });

    return NextResponse.redirect(new URL(state, req.url));
  } catch (error) {
    console.error("❌ [Google OAuth] Callback Error:", error);
    return NextResponse.redirect(new URL('/login?error=OAuthFailed', req.url));
  }
}
