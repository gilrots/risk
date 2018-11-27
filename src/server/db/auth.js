const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Users = require('./models').Users;
const config = require('../../common/config').DB.JWT;

function authenticate(params) {
    return Users.findOne({
        where: {
            UserName: params.login
        },
        Row: true
    }).then(user => {
        if (!user)
            throw new Error('Authentication failed. User not found.');
        console.log(params.Password)
        console.log(user.Password)
        console.log(user.Password===params.Password)
        if (!bcrypt.compareSync(params.Password, user.Password))
            throw new Error('Authentication failed. Wrong password.');
        const payload = {
            login: user.UserName,
            id: user.id,
            time: new Date()
        };
        const token = jwt.sign(payload, config.jwtSecret, {
            expiresIn: config.tokenExpireTime
        });
        return token;
    });
}

function checkAuth(req, res, next) {
    const token = req.headers['token'];
    if (!token)
        return res.status(403).send({ auth: false, message: 'No token provided.' });

    jwt.verify(token, config.jwtSecret, (err, decoded) => {
        if (err)
            return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
        req.user = {
            login: decoded.login,
            id: decoded.id
        };
        next();
    });
}

module.exports = {authenticate}
