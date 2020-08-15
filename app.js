require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongooose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));

// express-session
app.use(session({
    secret: "Our little secret.",
    resave: false,
    saveUninitialized: false
}));

// Passport initialization
app.use(passport.initialize());
app.use(passport.session());

// DATABASE
mongooose.connect("mongodb://localhost:27017/userDB", { useNewUrlParser: true, useUnifiedTopology: true }, function(err) {
    if (!err) {
        console.log("Successfully connected to usersDB");
    }
});
mongooose.set("useCreateIndex", true);

const userSchema = new mongooose.Schema({
    email: String,
    password: String
});

userSchema.plugin(passportLocalMongoose);

const User = new mongooose.model("User", userSchema);

// Passport local login strategy and serialize/deserialize
passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// GET HANDLERS
// GET REQUEST - HOME
app.get("/", function(req, res) {
    res.render("home");
});

// GET REQUEST - LOGIN
app.get("/login", function(req, res) {
    res.render("login");
});

// GET REQUEST - REGISTER
app.get("/register", function(req, res) {
    res.render("register");
});

// GET REQUEST - SECRETS
app.get("/secrets", function(req, res) {
    if (req.isAuthenticated()) {
        res.render("secrets");
    } else {
        res.redirect("/login");
    }
});

app.get("/logout", function(req, res){
    req.logout();
    res.redirect("/");
});

// POST HANDLERS
// POST REQUEST - REGISTER
app.post("/register", function(req, res) {

    User.register({ username: req.body.username }, req.body.password, function(err, user) {
        if (err) {
            console.log(err);
            res.redirect("/register");
        } else {
            passport.authenticate("local")(req, res, function() {
                res.redirect("/secrets");
            });
        }
    });

});

// POST REQUEST - LOGIN
app.post("/login", function(req, res) {

    const user = new User({
        username: req.body.username,
        password: req.body.password
    });

    req.login(user, function(err) {
        if (err) {
            console.log(err);
        } else {
            passport.authenticate("local")(req, res, function() {
                res.redirect("/secrets");
            });
        }
    });

});

// SERVER ON PORT 3000
app.listen(3000, function() {
    console.log("Server started on port 3000");
});