const _ = require("lodash");
const pathToRegexp = require("path-to-regexp");
const { Matcher } = require("@lovejs/components/routing");

class EnvironmentMatcher extends Matcher {
    constructor(environment) {
        super();
        this.environment = environment;
    }

    getOptionsSchema() {
        return {
            oneOf: [{ type: "string" }, { type: "array", items: { type: "string" } }]
        };
    }

    normalizeOptions(options) {
        return _.isArray(options) ? options : [options];
    }

    match(context, environments, route) {
        return environments.includes(this.environment);
    }
}

module.exports = EnvironmentMatcher;
