import jwt from'jsonwebtoken'
import {secret} from '../config.js'

export default function authMiddleware (req, res, next) {
    if (req.method === "OPTIONS") {
        next()
    }

    try {
        const token = req.headers.authorization.split(' ')[1]
        if (!token) {
            res.redirect("/login");
            return res.status(403).json({message: "Пользователь не авторизован"})
        }
        req.user = jwt.verify(token, secret)
        next()
    } catch (e) {
        console.log(e)
        return res.status(403).json({message: "Пользователь не авторизован"})
    }
};