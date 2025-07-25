const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const { PrismaClient } = require('@prisma/client');
const DbClient = new PrismaClient();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const YandexStrategy = require('passport-yandex').Strategy;
const DribbbleStrategy = require('passport-dribbble').Strategy;

const generateAccessToken = (id, roles) => {
  const payload = { id, roles: Array.isArray(roles) ? roles : [roles] };
  return jwt.sign(payload, process.env.SECRET, { expiresIn: '12h' });
};

// Serialize/deserialize are not strictly required for JWT based auth but
// passport expects them when using sessions; we provide no-op versions.
passport.serializeUser((user, done) => {
  done(null, user.id);
});
passport.deserializeUser(async (id, done) => {
  try {
    const user = await DbClient.user.findUnique({ where: { id } });
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

// Helper to create or fetch a user by provider.
async function findOrCreateSocialUser({ provider, providerId, email, firstName }) {
  // Try to find existing by provider id first
  let user = await DbClient.user.findFirst({
    where: {
      [`${provider}Id`]: providerId,
    },
  });

  if (!user && email) {
    // Maybe the user created an account previously with email/password
    user = await DbClient.user.findUnique({ where: { email } });
  }

  if (user) {
    // Ensure provider id is stored
    const updateData = {};
    if (!user[`${provider}Id`]) {
      updateData[`${provider}Id`] = providerId;
    }
    if (Object.keys(updateData).length) {
      user = await DbClient.user.update({ where: { id: user.id }, data: updateData });
    }
    return user;
  }

  // If still no user, create new one
  const randomPassword = await bcrypt.hash(providerId + Date.now(), 5);
  const newUser = await DbClient.user.create({
    data: {
      email: email || `${provider}_${providerId}@example.com`,
      username: `${provider}_${providerId}`,
      password: randomPassword,
      role: 'USER',
      isVerified: true, // Social providers provide verified emails
      [`${provider}Id`]: providerId,
    },
  });

  // Also create profile stub
  await DbClient.profile.create({
    data: {
      userId: newUser.id,
      name: firstName || '',
      skills: [],
    },
  });

  return newUser;
}

// GOOGLE
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: `${process.env.BASE_URL}/auth/google/callback`,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails && profile.emails[0].value;
          const user = await findOrCreateSocialUser({
            provider: 'google',
            providerId: profile.id,
            email,
            firstName: profile.name && profile.name.givenName,
          });
          return done(null, user);
        } catch (err) {
          return done(err, null);
        }
      }
    )
  );
} else {
  console.warn('Google OAuth credentials are not set. Skipping Google strategy.');
}

// FACEBOOK
if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
  passport.use(
    new FacebookStrategy(
      {
        clientID: process.env.FACEBOOK_APP_ID,
        clientSecret: process.env.FACEBOOK_APP_SECRET,
        callbackURL: `${process.env.BASE_URL}/auth/facebook/callback`,
        profileFields: ['id', 'emails', 'name'],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails && profile.emails[0].value;
          const user = await findOrCreateSocialUser({
            provider: 'facebook',
            providerId: profile.id,
            email,
            firstName: profile.name && profile.name.givenName,
          });
          return done(null, user);
        } catch (err) {
          return done(err, null);
        }
      }
    )
  );
} else {
  console.warn('Facebook OAuth credentials are not set. Skipping Facebook strategy.');
}

// YANDEX
if (process.env.YANDEX_CLIENT_ID && process.env.YANDEX_CLIENT_SECRET) {
  passport.use(
    new YandexStrategy(
      {
        clientID: process.env.YANDEX_CLIENT_ID,
        clientSecret: process.env.YANDEX_CLIENT_SECRET,
        callbackURL: `${process.env.BASE_URL}/auth/yandex/callback`,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails && profile.emails[0].value;
          const user = await findOrCreateSocialUser({
            provider: 'yandex',
            providerId: profile.id,
            email,
            firstName: profile.displayName,
          });
          return done(null, user);
        } catch (err) {
          return done(err, null);
        }
      }
    )
  );
} else {
  console.warn('Yandex OAuth credentials are not set. Skipping Yandex strategy.');
}

// DRIBBBLE
if (process.env.DRIBBBLE_CLIENT_ID && process.env.DRIBBBLE_CLIENT_SECRET) {
  passport.use(
    new DribbbleStrategy(
      {
        clientID: process.env.DRIBBBLE_CLIENT_ID,
        clientSecret: process.env.DRIBBBLE_CLIENT_SECRET,
        callbackURL: `${process.env.BASE_URL}/auth/dribbble/callback`,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails && profile.emails[0];
          const user = await findOrCreateSocialUser({
            provider: 'dribbble',
            providerId: profile.id,
            email,
            firstName: profile.displayName,
          });
          return done(null, user);
        } catch (err) {
          return done(err, null);
        }
      }
    )
  );
} else {
  console.warn('Dribbble OAuth credentials are not set. Skipping Dribbble strategy.');
}

// Middleware to issue JWT and redirect to frontend
function socialCallback(req, res) {
  const token = generateAccessToken(req.user.id, req.user.role);
  const redirectUrl = `${process.env.FRONTEND_URL}/social-auth?token=${token}`;
  return res.redirect(redirectUrl);
}

module.exports = { passport, socialCallback }; 