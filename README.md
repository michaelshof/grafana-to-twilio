# grafana-to-twilio

![Node.js CI Badge](https://github.com/michaelshof/grafana-to-twilio/actions/workflows/node.js.yml/badge.svg)

## Configuration

Using environment variables and `.env` file.

### File Paths

- `CONTACTS_FILE_PATH`: default `'./contacts.json'`
- `CONTACT_GROUPS_FILE_PATH`: default `'./contact_groups.json'`
- `TWIML_FILE_PATH`: default `'./twiml.xml.ejs'`

### HTTPD (express)

- `HTTPD_BEARER_TOKEN`: default `` - Optional Bearer Token authentication for API calls starting with /call.
- `HTTPD_PORT`: default `3000`
- `HTTPD_RATE_WINDOW_CALL`: default `60000` ms - Rate Limiting for API calls starting with /call.
- `HTTPD_RATE_LIMIT_CALL`: default `10`

### Twilio

- `TWILIO_ACCOUNT_SID`: default `` - The SID of the Account that will create the resource.
- `TWILIO_AUTH_TOKEN`: default `` - The Auth Token of the Account that will create the resource.
- `TWILIO_LOG_LEVEL`: default `debug`
- `TWILIO_PHONE_NUMBER`: default `` - The phone number or client identifier to use as the caller id.
- `TWILIO_TIMEOUT`: default `30` - The integer number of seconds that we should allow the phone to ring before assuming there is no answer. Can be overridden by each contact.

### Contacts

Define your contacts in a JSON file in the following structure:

```json
{
    "contact-id1": { "phone_number": "+123456879" },
    "contact-id2": { "phone_number": "+128934765", "timeout": 10 },
    "contact-id3": { "phone_number": "+123459876" },
}
```

### Contact Groups

Define your contact groups in a JSON file in the following structure:

```json
{
    "group-id": [ "contact-id1", "contact-id2", "contact-id3" ]
}
```

### TwiML

In the XML you can use EJS to process the Web Hook Data and output parts of it.

```xml
<Response>
	<Pause length="1"/>
	<Say loop="3">
		You have an alert from Grafana with the name <%= commonLabels.alertname %>. Message:
		<break time="1s"/>
		<%= commonAnnotations.summary %>
		<break time="1s"/>
		End of message.
		<break time="1s"/>
		It will be repeated three times.
		<break time="3s"/>
	</Say>
	<Say>Goodbye.</Say>
</Response>
```

See: https://www.twilio.com/docs/voice/twiml

## API Endpoints

- `POST /call/contact/<CONTACT-ID>` - To call a single contact.
- `POST /call/contact_group/<CONTACT-GROUP-ID>` - To call a whole contact group.

Both endpoints are designed to be used as grafana webhook contact point. Therefore both endpoints expect a request with a JSON body. See [grafana webhook configuration](https://grafana.com/docs/grafana/latest/alerting/configure-notifications/manage-contact-points/integrations/webhook-notifier/) documentation for details.

## NPM

Scripts are configured in `package.json`

* `npm run build`: Runs the TypeScript Compiler.
* `npm run lint`: Runs ESLint.
* `npm run pm2:deploy`: Runs the PM2 deploy command.
* `npm run pm2:save`: Runs the PM2 save command on the remote machine.
* `npm run pm2:setup`: Runs the PM2 deploy setup command.
* `npm run start`: Runs the compiled JavaScript with Node.
* `npm run test`: Runs the tests with JEST.

## PM2

Define `ecosystem.config.js` file to use PM2 for deployments. Example: `pm2/ecosystem.example.js`

* Copy the `post-setup.sh` script into the `shared` directory on your server.
* Copy the `pre-deploy.sh` script into the `shared` directory on your server.

## Docker

* Exposes express server on port 3000.
* Defines volume `/srv/grafana-to-twilio/config` where the configuration files `contacts.json`, `contact_groups.json` and `twiml.xml.ejs` are expected.
