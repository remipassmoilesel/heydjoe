
FROM ubuntu:16.04
MAINTAINER remipassmoilesel
LABEL name="Hey Djoe !" description="All you need for instant messaging :)"

# Add configuration file to system
ADD djoe-docker-config.sh /opt/djoe-docker-config.sh

# Display configuration
RUN /bin/bash -x /opt/djoe-docker-config.sh

# Update system
RUN echo "Running APT installation ..." && echo
RUN apt-get update \
    && apt-get -y install apache2 postgresql coturn curl wget \
    && apt-get -y install git openssh-server xz-utils openssl

# Download dependencies only if necessary (see config.sh)
# and extract them
RUN echo "Download and extract dependencies ..." && echo
ADD djoe-dependencies/ /opt/djoe-dependencies

RUN cd /opt/djoe-dependencies \
    && chmod +x get-dependencies.sh && sync && ./get-dependencies.sh

# Download XMPP client and configuration
RUN echo "Download and setup Djoe ..." && echo
RUN cd /opt/ && git clone https://github.com/remipassmoilesel/djoe djoe-project

# Configure Apache
RUN cd /opt/djoe-dependencies \
    && chmod +x setup-apache.sh && sync && ./setup-apache.sh


EXPOSE 80 443 3500-65000



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



