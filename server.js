// Required modules
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const DiscordStrategy = require('passport-discord').Strategy;
const Discord = require('discord.js');
const path = require('path');
require('dotenv').config();

// Express setup
const app = express();
const PORT = process.env.PORT || 8080;

// Serve static files (your index.html and assets)
// Serve static files (your index.html and assets)
app.use(express.static(__dirname));


// Discord Bot setup
const client = new Discord.Client({ intents: [
    Discord.GatewayIntentBits.Guilds,
    Discord.GatewayIntentBits.GuildMembers
] });

client.login(process.env.BOT_TOKEN);

// Session setup
app.use(session({
    secret: 'vortex_secret_key',
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

// Passport Discord Strategy
passport.use(new DiscordStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: process.env.CALLBACK_URL,
    scope: ['identify', 'guilds', 'guilds.join']
}, (accessToken, refreshToken, profile, done) => {
    return done(null, profile);
}));

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

// Routes
app.get('/login', passport.authenticate('discord'));

app.get('/callback', passport.authenticate('discord', { failureRedirect: '/' }), (req, res) => {
    res.redirect('/verify');
});

app.get('/verify', async (req, res) => {
    if (!req.user) return res.redirect('/');

    const guild = await client.guilds.fetch(process.env.SERVER_ID);
    const member = await guild.members.fetch(req.user.id).catch(() => null);

    if (!member) {
        return res.send('❌ You must join the Discord server first.');
    }

    if (!member.roles.cache.has(process.env.VERIFIED_ROLE_ID)) {
        await member.roles.add(process.env.VERIFIED_ROLE_ID).catch(console.error);
        return res.send('✅ You have been verified and the role has been assigned!');
    } else {
        return res.send('✅ You are already verified.');
    }
});

app.get('/', (req, res) => {
    res.send('Visit your frontend homepage to log in.');
});

app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
