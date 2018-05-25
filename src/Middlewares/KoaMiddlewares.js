const _ = require("lodash");
const sender = require("koa-send");
const { Middleware } = require("@lovejs/components/middlewares");

class KoaMiddleware extends Middleware {
    constructor(module) {
        super();
        this.middleware = require(module);
    }

    getMiddleware(options) {
        if (!_.isArray(options)) {
            options = [options];
        }

        return this.middleware(...options);
    }
}

module.exports = KoaMiddleware;
