const _ = require("lodash");
const sender = require("send");
const { Middleware } = require("@lovejs/components/middlewares");

class Error404Middleware extends Middleware {
    getMiddleware() {
        return async context => {
            return context.throw(404, "Page not found");
        };
    }
}

module.exports = Error404Middleware;
