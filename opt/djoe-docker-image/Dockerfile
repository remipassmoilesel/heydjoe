
FROM ubuntu:14.04
MAINTAINER remipassmoilesel
LABEL name="Hey Djoe !" description="All you need for instant messaging :)"

RUN apt-get update \
    && apt-get -y install apache2 postgresql rfc5766-turn-server curl wget git sslh rsync xz-utils

ADD dependencies/ /opt/dependencies

# Only if necessary
# RUN cd /opt/dependencies \
#    && chmod +x get-dependencies.sh && sync && ./get-dependencies.sh

RUN cd /opt/dependencies \
    && tar -xf openfire.tar.gz \
    && mv openfire /opt/ \
    && tar -xf nodejs4.tar.gz \
    && mv node-v4.4.7-linux-x64 /opt/nodejs4/

RUN cd /opt/ \
    && git clone https://github.com/remipassmoilesel/djoe \
    && cd djoe/ \
    && rsync -az etc/ /etc/ \
    && rsync -az opt/ /opt/ \
    && rsync -az var/ /var/

RUN find /etc/ -type f -exec sed -i 's/im\.silverpeas\.net/${domain}/g' {}
RUN find /opt/ -type f -exec sed -i 's/im\.silverpeas\.net/${domain}/g' {}
RUN find /var/ -type f -exec sed -i 's/im\.silverpeas\.net/${domain}/g' {}

EXPOSE 80 443



#
## installer node et etherpad
#RUN cd opt/ \
#    && git clone https://github.com/ether/etherpad-lite/ \
#    && wget https://nodejs.org/dist/v4.4.4/node-v4.4.4-linux-x64.tar.xz \
#    && tar -xf node-v4.4.4-linux-x64.tar.xz \
#    && mv node-v4.4.4-linux-x64 node
#
#ADD opt.etherpad.settings.json /opt/etherpad/settings.json
#
## fichier de lancement des serveurs
#ADD opt.docker-entrypoint.sh /opt/docker-entrypoint.sh
#RUN chmod +x /opt/docker-entrypoint.sh
#
## Le script lancé au démarrage du conteneur
#ENTRYPOINT /opt/docker-entrypoint.sh
#
## ouvrir les ports nécéssaires
#EXPOSE 80 7070 9090 9091 9001



