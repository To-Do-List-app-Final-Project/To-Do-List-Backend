const express = require("express")
//middleware
const validateMiddleware = require("../middleware/validate.middleware")

//* Routing Options:
const userRoute = require("./app/user/user.route")
const literal = require("../exports/literal")
let expressWs = require("express-ws")

const routerApp = express.Router()

const categoryRoute = require("./app/categories/categories.route")
const taskRoute = require("./app/tasks/tasks.route")

const RoutingList = (app) => {
    const routes = [
        {
            path: "/categories",
            route: categoryRoute
        },
        {
            path: "/tasks",
            route: taskRoute
        }
    ]


    routerApp.post("/users/login", userRoute.Operation.login)
    routerApp.post("/users/register", userRoute.Operation.register)
    routerApp.post("/users/forgetPassword", userRoute.Operation.requestResetPwd)
    routerApp.use(validateMiddleware.power()) //增加登陆中间件的验证
    routerApp.get("/users/me", userRoute.Operation.me)

    routes.forEach((route) => {
        routerApp.use(route.path, route.route)
    })
    app.use(literal.RouterFront, routerApp)

    // const wsApp = express()
    // expressWs(wsApp)
    // wsApp.use("/ws", wsRoute)
    // wsApp.listen(process.env.WsPort)

}

module.exports = { RoutingList }
