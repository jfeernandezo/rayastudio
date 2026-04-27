import dns from "dns";

dns.setDefaultResultOrder("ipv4first");

const resolver = new dns.Resolver();
resolver.setServers(["1.1.1.1", "8.8.8.8"]);

const nativeLookup = dns.lookup;
const debug = process.env.DNS_DEBUG === "true";

(dns as any).lookup = (hostname: string, options: any, callback: any) => {
    const cb = typeof options === "function" ? options : callback;
    const opts = typeof options === "function" ? {} : options;

    resolver.resolve4(hostname, (err, addresses) => {
        if (!err && addresses?.length) {
            cb(null, addresses[0], 4);
        } else {
            if (debug) {
                console.warn(
                    `[dns-fix] Cloudflare/Google DNS falhou para "${hostname}" (${err?.code || "no addresses"}); usando resolver nativo.`,
                );
            }
            (nativeLookup as any)(hostname, opts, cb);
        }
    });
};
