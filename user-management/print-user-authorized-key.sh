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

# check if USER_NAME is set
if [ -z "${USER_NAME}" ]; then
    echo "USER_NAME: variable not set!"
    exit 1;
fi

# Check if the user exists
if ssh -i "${HOST_PEM}" "${LOGIN_USER}@${HOST_IP}" "id -u $ec2_user" >/dev/null 2>&1; then
    USER_EXISTS=true
else
    USER_EXISTS=false
fi

echo "${USER_NAME} exists: $USER_EXISTS"

# access the host and print the users' authorized keys
ssh -i "${HOST_PEM}" ${LOGIN_USER}@${HOST_IP} "sudo cat /home/${USER_NAME}/.ssh/authorized_keys"
