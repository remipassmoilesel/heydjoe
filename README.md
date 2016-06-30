# Hey Djoe !

Instant communication system using XMPP, WebRTC and WebSockets.

Working with:
    * JSXC
    * Etherpad
    * Openfire
    * RFC-5766 TURN Server
    
Docker file will be updated ASAP :)

File tree:

```
    .
    ├── docker
    │   ├── build-and-launch.sh
    │   ├── Dockerfile
    │   └── README.md
    ├── etc
    │   ├── apache2
    │   │   └── sites-available
    │   │       ├── archives
    │   │       └── im.silverpeas.net.conf
    │   ├── init
    │   │   ├── djoe.conf
    │   │   └── silverpeas.conf
    │   ├── init.d
    │   │   └── ...
    │   ├── monitorix
    │   │   └── monitorix.conf
    │   ├── reTurn
    │   │   └── reTurnServer.config
    │   ├── ssl
    │   │   └── ...
    │   └── turnserver.conf
    ├── LICENSE.txt
    ├── opt
    │   ├── docker-entrypoint.sh
    │   ├── etherpad-lite
    │   │   └── settings.json
    │   ├── openfire
    │   │   ├── conf
    │   │   │   ├── crossdomain.xml
    │   │   │   └── openfire.xml
    │   │   └── resources
    │   │       └── security
    │   │           └── ...
    │   └── silverpeas-6.0-SNAPSHOT-wildfly10
    │       ├── bin
    │       │   └── settings.gradle
    │       ├── configuration
    │       │   └── config.properties
    │       ├── export-vars.sh
    │       └── set-env.sh
    ├── utils
    │   ├── config-list.txt
    │   ├── firewall-test
    │   │   ├── firewall.activate
    │   │   ├── firewall.deactivate
    │   │   └── README.md
    │   ├── get-config-files.sh
    │   ├── grunt-build.sh
    │   ├── grunt-dev.sh
    │   ├── grunt-jsdoc.sh
    │   ├── KeyStoreImport.java
    │   ├── publish-demo.sh
    │   ├── publish-silverpeas-distant.sh
    │   ├── publish-silverpeas-local.sh
    │   └── publish-silverpeas-rapid.sh
    └── var
        └── www
            └── djoe
                └── ...
    
    6868 directories, 57800 files

```



