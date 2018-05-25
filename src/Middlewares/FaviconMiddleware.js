const _ = require("lodash");
const sender = require("koa-send");
const { Middleware } = require("@lovejs/components/middlewares");

class FaviconMiddleware extends Middleware {
    getOptionsSchema() {
        return { type: "string" };
    }

    getMiddleware(path) {
        return async (context, next) => {
            if (context.path == "/favicon.ico") {
                return await sender(context, path);
            }

            return await next();
        };
    }
}

module.exports = FaviconMiddleware;
