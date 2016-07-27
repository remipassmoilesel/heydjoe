# Misc utils for test in restrictive environment

_/!\ Be careful, these scripts modify IPTables configuration !

## firewall.activate
Restrict traffic to these ports:
* 80 tcp / udp (HTTP)
* 443 tcp / udp (HTTPS)
* 7443 tcp / udp (BOSH S)
* (plus DNS service)
