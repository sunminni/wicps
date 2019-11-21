#! /bin/bash

# Assumed Ubuntu Server 16.04 LTS AMI launched on AWS EC2


# Installing MongoDB (https://docs.mongodb.com/manual/tutorial/install-mongodb-on-ubuntu/) ---------------------------------------------------------------

# Import the public key used by the package management system.
wget -qO - https://www.mongodb.org/static/pgp/server-4.2.asc | sudo apt-key add -

# Create a list file for MongoDB.
echo "deb [ arch=amd64 ] https://repo.mongodb.org/apt/ubuntu xenial/mongodb-org/4.2 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-4.2.list

# Reload local package database.
sudo apt-get update

# Install the MongoDB packages.
sudo apt-get install -y mongodb-org

# Pin the package at the currently installed version
echo "mongodb-org hold" | sudo dpkg --set-selections
echo "mongodb-org-server hold" | sudo dpkg --set-selections
echo "mongodb-org-shell hold" | sudo dpkg --set-selections
echo "mongodb-org-mongos hold" | sudo dpkg --set-selections
echo "mongodb-org-tools hold" | sudo dpkg --set-selections

# Start MongoDB.
sudo service mongod start

# Verify that MongoDB has started successfully
sudo service mongod status

# --------------------------------------------------------------------------------------------------------------------------------------------------------

# Install nodejs
sudo apt-get install nodejs

# Install npm
sudo apt-get install npm


