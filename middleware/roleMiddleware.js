import jwt from'jsonwebtoken'
import {secret} from '../config.js'


export default function roleMiddleware(roles) {
    return function (req, res, next) {
        if (req.method === "OPTIONS") {
            next()
        }

        try {
            console.log("auth token:");
            console.log(req.headers.authorization)
            const token = req.headers.authorization.split(' ')[1]
            if (!token) {
                // return res.status(403).json({message: "Пользователь не авторизован"})
                res.redirect("https://oilan.io/login");
            }
            const decodedData = jwt.verify(token, secret)

            const {roleId} = decodedData;

            let hasRole = false

            roles.forEach(item => {
                if(item === roleId){
                    hasRole = true;
                }
            })

            if (!hasRole) {
                return res.status(403).json({message: "У вас нет доступа"})
            }

            req.user = decodedData
            next();
        } catch (e) {
            console.log(e)
            return res.status(403).json({message: "Пользователь не авторизован"})
        }
    }
};