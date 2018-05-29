const _ = require("lodash");
const sender = require("koa-send");
const { Middleware } = require("@lovejs/components/middlewares");

class KoaMiddleware extends Middleware {
    constructor(module) {
        super();
        try {
            this.middleware = require(module);
        } catch (e) {
            console.error("Missing koa middleware ", e);
        }
    }

    getMiddleware(options) {
        if (!_.isArray(options)) {
            options = [options];
        }

        return this.middleware(...options);
    }
}

module.exports = KoaMiddleware;
