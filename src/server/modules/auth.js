const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const UsersDL = require('../db/users');
const config = require('../../common/config').DB.JWT;
const {LoginError} = require('./errors');
const errorMessage = 'Authentication failed. Wrong username or password.';

async function login(params) {
    const user = await UsersDL.getOne(params);
    if (!user || !isPasswordCorrect(params.password, user.password)){
       throw new LoginError(errorMessage);
    }

    const token = generateToken(user)
    return {token};
}

function generateToken(user) {
    const payload = {
        username: user.username,
        id: user.id,
        time: new Date()
    };
    const token = jwt.sign(payload, config.jwtSecret, {
        expiresIn: config.tokenExpireTime
    });

    return token;
}

function encryptPassword(password) {
    return bcrypt.hashSync(password,config.saltRounds);
}

function isPasswordCorrect(password, encrypted) {
    return bcrypt.compareSync(password, encrypted);
}

function auth(req, res, next) {
    let token = undefined;
    const auth = req.headers['authorization'];
    if(auth){
        token = auth.replace(/^Bearer\s/, '');
    }
    if (!token) {
        return res.status(403).send({auth: false, message: 'No token provided.'});
    }

    jwt.verify(token, config.jwtSecret, (err, decoded) => {
        if (err || !decoded) {
            return res.status(401).json({ auth: false, message: 'Failed to authenticate token.' });
        }
        
        const {id, username} = decoded;
        req.user = {id, username};
        const newToken = generateToken(req.user);
        res.set("token",newToken);
        next();
    });
}

module.exports = {login, encryptPassword, isPasswordCorrect, auth};
