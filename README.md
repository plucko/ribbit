# Ribbit

> Project Description
Ribbit gives everyone in the audience an equal voice by turning each person's laptop or phone into a mic. No waiting for mics to be passed. No waiting for the mic to turn on. No need for mics at all! 

## Team

  - __Product Owner__: SungMin Chang
  - __Scrum Master__: Ryan Atkinson
  - __Development Team Members__: Brian Hsu, Andy Kitson

## Table of Contents

1. [Usage](#Usage)
1. [Requirements](#requirements)
1. [Development](#development)
    1. [Installing Dependencies](#installing-dependencies)
    1. [Tasks](#tasks)
1. [Team](#team)
1. [Contributing](#contributing)

## Usage

> Some usage instructions


## Requirements

- Node 0.12.0

## Development

### Installing Dependencies
have mongodb? If not:
http://docs.mongodb.org/v2.2/tutorial/install-mongodb-on-os-x/

githubapp.js
  * You will need to include this file in the server folder.
  * This file contains your credentials for Github authentication.
  * It will contain the following:
    module.exports = {
     clientID:"< get this from signing up your app with github >",
     secret:"< get this from signing up your app with github >"
    };
  * When you signup use the following for local testing:
callbackURL: 'http://127.0.0.1:8000/auth/github/callback'

From within the root directory:

```sh
sudo npm install -g bower
npm install
bower install
```

### Roadmap

1. Access Microphone
1. Grab data from microphone
1. Transmit Data
1. Server Maintains Connection
1. Passes through server
1. Servers serve to presenter's client
1. Pass audio data to system audo output

View the project roadmap [here](LINK_TO_PROJECT_ISSUES)


## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines.
