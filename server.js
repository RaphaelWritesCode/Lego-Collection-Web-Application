/********************************************************************************
* WEB322 – Assignment 06
*
* I declare that this assignment is my own work in accordance with Seneca's
* Academic Integrity Policy:
*
* https://www.senecacollege.ca/about/policies/academic-integrity-policy.html
*
* Name: Raphael Antioquia   Student ID: 031379126    Date: Dec 7, 2023
*
* Published URL: ___________________________________________________________
*
********************************************************************************/

const legoData = require("./modules/legoSets"); 
const express = require('express');
const path = require('path');
const app = express();
const authData = require('./modules/auth-service');
var clientSessions = require("client-sessions");


const HTTP_PORT = process.env.PORT || 8080;

app.set('view engine', 'ejs');

app.use(express.static("public"));

app.use(express.urlencoded({ extended: true }));

app.use(
    clientSessions({
      cookieName: 'session', // this is the object name that will be added to 'req'
      secret: 'K4nw6HtVfGA33diVoix5eyTJk', // this should be a long un-guessable string.
      duration: 2 * 60 * 1000, // duration of the session in milliseconds (2 minutes)
      activeDuration: 1000 * 60, // the session will be extended by this many ms each request (1 minute)
    })
);

app.use((req, res, next) => {
    res.locals.session = req.session;
    next();
});

function ensureLogin(req, res, next) {
    if (!req.session.user) {
      res.redirect('/login');
    } else {
      next();
    }
  }

  app.get('/login', (req, res) => {
    res.render("login");
});

app.get('/register', (req, res) => {
    res.render("register");
});

app.post('/register', (req, res) => {
    authData.registerUser(req.body)
        .then(() => res.render("register", { successMessage: "User created" }))
        .catch(err => res.render("register", {
            errorMessage: err,
            userName: req.body.userName
        }));
});

app.post('/login', (req, res) => {
    req.body.userAgent = req.get('User-Agent');
    authData.checkUser(req.body)
        .then(user => {
            req.session.user = {
                userName: user.userName,
                email: user.email,
                loginHistory: user.loginHistory
            };
            res.redirect('/lego/sets');
        })
        .catch(err => res.render("login", {
            errorMessage: err,
            userName: req.body.userName
        }));
});

app.get('/logout', (req, res) => {
    req.session.reset(); 
    res.redirect('/');
});

app.get('/userHistory', ensureLogin, (req, res) => {
    res.render("userHistory");
});



// Update the "/" route to respond with the "/views/home.ejs" file
app.get('/', (req, res) => {
    res.render("home");
});

// Add an "/about" route that responds with "/views/about.ejs" file
app.get('/about', async (req, res) => {
    res.render("about");
});

// ADD SET
app.get('/lego/addSet', ensureLogin, async (req, res) => {
    try {
        let ThemeData = await legoData.getAllThemes();
        res.render('addSet', { themes: ThemeData });
    } catch (error) {
        res.render("500", { message: `Internal Server Error: ${err.message}` });
    }
});

app.post('/lego/addSet', ensureLogin, async (req, res) => {
    try {
        await legoData.addSet(req.body);
        res.redirect('/lego/sets');
    } catch (err) {
        res.render("500", { message: `I'm sorry, but we have encountered the following error: ${err}` });
    }
});

// EDIT SET

app.get('/lego/editSet/:num', ensureLogin, async (req, res) => {
    try {
        let setData = await legoData.getSetByNum(req.params.num);
        let themeData = await legoData.getAllThemes();

        if (!setData) {
            throw new Error('Set not found');
        }

        res.render("editSet", { themes: themeData, set: setData });
    } catch (err) {
        console.error(err);
        res.status(404).render("404", { message: err.message });
    }
});


app.post('/lego/editSet', ensureLogin, async (req, res) => {
    try {
        await legoData.editSet(req.body.set_num, req.body);

        res.redirect('/lego/sets');
    } catch (err) {
        console.error(err);
        res.render("500", { message: `I'm sorry, but we have encountered the following error: ${err}` });
    }
});


// DELETE SET
app.get('/lego/deleteSet/:num', ensureLogin, async (req, res) => {
    try {
        await legoData.deleteSet(req.params.num);
        res.redirect('/lego/sets');
    } catch (err) {
        res.render("500", { message: `I'm sorry, but we have encountered the following error: ${err}` });
    }
});



// lego set queries theme, if not it provides all sets
app.get('/lego/sets', async (req, res) => {
    try {
        if (req.query.theme) {
            let foundTheme = await legoData.getSetsByTheme(req.query.theme);
            res.render("sets", {sets: foundTheme});
        } else {            
            let allSets = await legoData.getAllSets();
            res.render("sets", {sets: allSets});
        }
    } catch (error) {
        res.status(404).render("404", {message: "I'm sorry, we're unable to find the THEME you're looking for!"});
    }
});


// Updated lego/sets/id-demo
app.get('/lego/sets/:id', async (req, res) => {
    try {
        let foundID = await legoData.getSetByNum(req.params.id);
        if (foundID) {
            res.render('set', {set: foundID});
        } else {
            res.status(404).render("404", {message: "I'm sorry, we're unable to find the SET NUMBER you're looking for!"});
        }
    } catch {
        res.status(404).render("404", {message: "I'm sorry, we're unable to find the SET NUMBER you're looking for!"});
    }
});

// Catch-all for 404 errors
app.use((req, res) => {
    res.status(404).render("404", {message: "I'm sorry, we're unable to find what you're looking for!"});
});

legoData.initialize()
    .then(authData.initialize)
    .then(function() {
        app.listen(HTTP_PORT, function() {
            console.log(`app listening on: ${HTTP_PORT}`);
        });
    }).catch(function(err) {
        console.log(`unable to start server: ${err}`);
    });


