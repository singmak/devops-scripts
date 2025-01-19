#!/bin/bash

# check if the host IP is set
if [ -z "${HOST_IP}" ]; then
    echo "HOST_IP: variable not set!"
    exit 1;
fi

# check if the host login user is set
if [ -z "${LOGIN_USER}" ]; then
    echo "LOGIN_USER: variable not set!"
    exit 1;
fi

# check if the host pem file is set
if [ -z "${HOST_PEM}" ]; then
    echo "HOST_PEM: variable not set!"
    exit 1;
fi

# access the host and print the users
ssh -i "${HOST_PEM}" ${LOGIN_USER}@${HOST_IP} "cat /etc/passwd | grep -Eo '^[^:]+'"
