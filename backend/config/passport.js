const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/User");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.BACKEND_URL || "http://localhost:5000"}/api/users/auth/google/callback`,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        console.log("Google profile received:", {
          id: profile.id,
          email: profile.emails?.[0]?.value,
          name: profile.displayName,
        });

        const googleEmail = profile.emails?.[0]?.value?.trim().toLowerCase();

        if (!googleEmail) {
          console.log("No email returned from Google");
          return done(null, false);
        }

        let user = await User.findOne({ googleId: profile.id });

        if (!user) {
          user = await User.findOne({ email: googleEmail });

          if (user) {
            user.googleId = profile.id;
            user.avatar = user.avatar || profile.photos?.[0]?.value || null;
            await user.save();
            console.log("Linked Google account to existing user:", user.email);
          } else {
            user = await User.create({
              name: profile.displayName,
              email: googleEmail,
              password: Math.random().toString(36).slice(-10) + "!Google",
              googleId: profile.id,
              avatar: profile.photos?.[0]?.value || null,
            });
            console.log("Created new Google user:", user.email);
          }
        } else {
          console.log("Existing Google user found:", user.email);
        }

        return done(null, user);
      } catch (err) {
        console.error("Google OAuth strategy error:", err);
        return done(err, null);
      }
    }
  )
);

passport.serializeUser((user, done) => done(null, user.id));

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});