# Caddy met de DuckDNS-plugin, zodat het HTTPS-certificaat via de DNS-challenge
# wordt opgehaald (poort 80 hoeft dan niet open).
FROM caddy:2-builder AS builder
RUN xcaddy build --with github.com/caddy-dns/duckdns

FROM caddy:2
COPY --from=builder /usr/bin/caddy /usr/bin/caddy
COPY Caddyfile /etc/caddy/Caddyfile
