const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Users = require('../db/models').Users;
const config = require('../../common/config').DB.JWT;

function login(params) {
    const errorMessage = 'Authentication failed. Wrong username or password.';
    return Users.findOne({
        where: { username: params.username},
        Row: true
    }).then(user => {
        if (!user){
            throw new Error(errorMessage);
        }
        if (!bcrypt.compareSync(params.password, user.password)){
            throw new Error(errorMessage);
        }
        return {token:generateToken(user)};
    });
}

function generateToken(user) {
    const payload = {
        login: user.username,
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

function auth(req, res, next) {
    const token = req.headers['authorization'].replace(/^Bearer\s/, '');
    if (!token) {
        return res.status(403).send({auth: false, message: 'No token provided.'});
    }

    jwt.verify(token, config.jwtSecret, (err, decoded) => {
        if (err || !decoded) {
            res.status(401).json({ auth: false, message: 'Failed to authenticate token.' });
        }
        else {
            const {id, login} = decoded;
            req.user = {id, login};
            const newToken = generateToken(req.user);
            res.set("token",newToken);
            next();
        }
    });
}

module.exports = {login, encryptPassword, auth};
