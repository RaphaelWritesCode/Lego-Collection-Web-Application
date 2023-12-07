const mongoose = require('mongoose');
const Schema = mongoose.Schema;
require('dotenv').config();
const bcrypt = require('bcryptjs');

const userSchema = new Schema({
    userName: {
        type: String,
        unique: true
    },
    password: String,
    email: String,
    loginHistory: [
        {
            dateTime: Date,
            userAgent: String
        }
    ]
});

let User;

// Initialize function
function initialize() {
    return new Promise(function (resolve, reject) {
        let db = mongoose.createConnection(process.env.MONGODB);

        db.on('error', (err) => {
            reject(err);
        });

        db.once('open', () => {
            User = db.model("users", userSchema); 
            resolve();
        });
    });
}

function registerUser(userData) {
    return new Promise((resolve, reject) => {
        
        if (userData.password !== userData.password2) {
            reject("Passwords do not match");
            return;
        }

        
        bcrypt.hash(userData.password, 10)
            .then(hash => {
                
                let newUser = new User({
                    userName: userData.userName,
                    password: hash, // use the hashed password
                    email: userData.email,
                    loginHistory: [] 
                });

                
                return newUser.save();
            })
            .then(() => resolve())
            .catch(err => {
                if (err.code === 11000) {
                    
                    reject("User Name already taken");
                } else if (err) {
                    
                    reject("There was an error creating the user: " + err);
                }
            });
    });
}

function checkUser(userData) {
    return new Promise((resolve, reject) => {
        User.findOne({ userName: userData.userName })
            .then(user => {
                if (!user) {
                    reject("Unable to find user: " + userData.userName);
                    return;
                }

                
                return bcrypt.compare(userData.password, user.password)
                    .then(result => {
                        if (!result) {
                            throw new Error("Incorrect Password for user: " + userData.userName);
                        }

                        
                        if (user.loginHistory.length === 8) {
                            user.loginHistory.pop();
                        }
                        user.loginHistory.unshift({
                            dateTime: new Date().toString(),
                            userAgent: userData.userAgent
                        });

                        
                        return User.updateOne({ userName: userData.userName }, { $set: { loginHistory: user.loginHistory } });
                    })
                    .then(() => resolve(user));
            })
            .catch(err => reject(err.message || "Unable to find user: " + userData.userName));
    });
}

module.exports = {
    User,
    initialize,
    registerUser,
    checkUser
};