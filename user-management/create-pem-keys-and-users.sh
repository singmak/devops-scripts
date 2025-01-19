#!/bin/bash

# User JSON file example
# [
#   {
#     "ec2_user": "user1"
#   },
#   {
#     "ec2_user": "user2"
#   }
# ]

if [ ! -f "${USER_JSON}" ]; then
    echo "USER_JSON: file not found!"
    exit 1;
fi

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

USER_COUNT=$(jq -r '. | length' ${USER_JSON})
# count=`jq '.users | length' users.json`

CURRENT_SCRIPT_DIR=$(dirname "$0")

KEY_DIR="${CURRENT_SCRIPT_DIR}/keys"
echo USER_COUNT $USER_COUNT
# iterate through the Bash array
for ((i=0; i<$USER_COUNT; i++)); do
  ec2_user=`jq -r '.['$i'].ec2_user' ${USER_JSON}`

  # access the host and check if the user exists and store the result in a variable
  echo "checking if user: ${ec2_user} exists"
  # Check if the user exists
  if ssh -i "${HOST_PEM}" "${LOGIN_USER}@${HOST_IP}" "id -u ${ec2_user}" >/dev/null; then
      USER_EXISTS=true
  else
      USER_EXISTS=false
  fi

  echo "${ec2_user} exists: $USER_EXISTS"

  # create the user and a new pem key if it does not exist
  if [ "$USER_EXISTS" = false ]; then
    echo "creating user: ${ec2_user}"
    ssh -i "${HOST_PEM}" ${LOGIN_USER}@${HOST_IP} "sudo useradd ${ec2_user}"

    # create the user's pem key
    USER_DIR="${KEY_DIR}/${ec2_user}"
    echo USER_DIR: $USER_DIR
    mkdir -p "${USER_DIR}"
    KEY_PATH="${USER_DIR}/${ec2_user}-ssh-key"
    echo "creating key for the user: ${ec2_user}"
    PASSWORD=$(openssl rand -base64 12)
    echo $PASSWORD > "${USER_DIR}/ssh-key-passphase"
    ssh-keygen -m PEM -f "${KEY_PATH}" -N ${PASSWORD}

    PUB_KEY_NAME="$KEY_PATH.pub"

    echo "${HOST_IP}" > "${USER_DIR}/email.md"
    echo "user name: ${ec2_user}" >> "${USER_DIR}/email.md"
    echo "pem passphase:" >> "${USER_DIR}/email.md"
    cat "${USER_DIR}/ssh-key-passphase" >> "${USER_DIR}/email.md"

    # copy the public key to the host
    SSH_PATH="/home/${ec2_user}/.ssh"

    scp -i "${HOST_PEM}" $PUB_KEY_NAME ${LOGIN_USER}@${HOST_IP}:/tmp
    ssh -i "${HOST_PEM}" ${LOGIN_USER}@${HOST_IP} "sudo mkdir -p ${SSH_PATH}"
    ssh -i "${HOST_PEM}" ${LOGIN_USER}@${HOST_IP} "sudo mv /tmp/$(basename $PUB_KEY_NAME) ${SSH_PATH}/authorized_keys"
    ssh -i "${HOST_PEM}" ${LOGIN_USER}@${HOST_IP} "sudo chown ${ec2_user}:${ec2_user} ${SSH_PATH}"
    ssh -i "${HOST_PEM}" ${LOGIN_USER}@${HOST_IP} "sudo chown ${ec2_user}:${ec2_user} ${SSH_PATH}/authorized_keys"
    ssh -i "${HOST_PEM}" ${LOGIN_USER}@${HOST_IP} "sudo chmod 700 ${SSH_PATH}"
    ssh -i "${HOST_PEM}" ${LOGIN_USER}@${HOST_IP} "sudo chmod 600 ${SSH_PATH}/authorized_keys"
  else
    echo "user: ${ec2_user} already exists"
  fi
done