const dns = require("dns");

const resolver = new dns.Resolver();
resolver.setServers(["1.1.1.1", "8.8.8.8"]);

const originalLookup = dns.lookup;

dns.lookup = function (hostname, options, callback) {
    const cb = typeof options === "function" ? options : callback;
    const opts = typeof options === "function" ? {} : options;

    resolver.resolve4(hostname, (err, addresses) => {
        if (!err && addresses && addresses.length > 0) {
            cb(null, addresses[0], 4);
        } else {
            originalLookup.call(dns, hostname, opts, cb);
        }
    });
};
