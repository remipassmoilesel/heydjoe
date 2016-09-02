#!/bin/bash

# Configuration for Djoe Docker image building

#
# /!\ All parameters are COMPULSORY
#

# If set to true, verbosity will be increased
#DJOE_DEBUG_MODE=false
DJOE_DEBUG_MODE=true

# If set to true, dependencies will be downloaded
#DJOE_DOWNLOAD_DEPENDENCIES=true
DJOE_DOWNLOAD_DEPENDENCIES=false

# If set to true, non certified TLS keys will be created, and behavior of demo website will
# be adapted. Otherwise you will have to specify where are keys
#DJOE_USE_NON_CERTIF_KEYS=false
DJOE_USE_NON_CERTIF_KEYS=true



