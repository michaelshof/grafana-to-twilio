# grafana-to-twilio

## Configuration

Using environment variables and `.env` file.

### File Paths

- `CONTACTS_FILE_PATH`: default `'./contacts.json'`
- `CONTACT_GROUPS_FILE_PATH`: default `'./contact_groups.json'`
- `TWIML_FILE_PATH`: default `'./twiml.xml.ejs'`

### HTTPD (express)

- `HTTPD_PORT`: default `3000`

### Twilio

- `TWILIO_ACCOUNT_SID`: default ``
- `TWILIO_AUTH_TOKEN`: default ``
- `TWILIO_LOG_LEVEL`: default `debug`
- `TWILIO_PHONE_NUMBER`: default ``
- `TWILIO_TIMEOUT`: default `30`

# NPM

Scripts are configured in `package.json`

## build

npx tsc

## lint

npx eslint

## start

node dist/src/index.js

## test

npx jest
