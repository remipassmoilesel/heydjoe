# Scripts de test de conditions de firewall restricitives

_/!\ Attention, ces scripts modifient la configuration d'IPTables
et le script de désactivation ne garantit pas un retour à la normale._

## firewall.activate
Limite le trafic à un minimum de ports ouverts. Pour le moment:
* 80 tcp / udp (HTTP)
* 443 tcp / udp (HTTPS)
* 7443 tcp / udp (BOSH S)
* (plus le service DNS)

Le passage du serveur XMPP sur 443 permettra à terme de se passer du dernier
 port.
