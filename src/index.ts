import fs from 'node:fs'

import bodyParser from 'body-parser'
import timestampPatch from 'console-stamp'
import dotenv from 'dotenv'
import ejs from 'ejs'
import express from 'express'
import bearerToken from 'express-bearer-token'
import { rateLimit } from 'express-rate-limit'
import morgan from 'morgan'
import twilioSDK from 'twilio'

import { Contact, Contacts, ContactGroups } from './types'
import { ensure_file_paths_exist, ensure_contacts_valid, ensure_contact_groups_valid, ensure_twilio_credentials_present } from './validations'

timestampPatch(console)

dotenv.config()
import { file_paths, httpd_config, twilio_config } from './configs'

file_paths.contacts = fs.realpathSync(file_paths.contacts)
file_paths.contact_groups = fs.realpathSync(file_paths.contact_groups)
file_paths.twiml_ejs = fs.realpathSync(file_paths.twiml_ejs)
ensure_file_paths_exist(file_paths)

console.info('CONFIG:', 'File-Path Contacts:', file_paths.contacts)
console.info('CONFIG:', 'File-Path Contact Groups:', file_paths.contact_groups)
console.info('CONFIG:', 'File-Path TwiML EJS:', file_paths.twiml_ejs)

const contacts_raw = JSON.parse(fs.readFileSync(file_paths.contacts, { encoding: 'utf-8' }))
const contact_groups_raw = JSON.parse(fs.readFileSync(file_paths.contact_groups, { encoding: 'utf-8' }))

const contacts = contacts_raw as Contacts
const contact_groups = contact_groups_raw as ContactGroups

ensure_contacts_valid(contacts)
console.info('CONFIG:', `Loaded ${Object.keys(contacts).length} contacts`)
ensure_contact_groups_valid(contact_groups, contacts)
console.info('CONFIG:', `Loaded ${Object.keys(contact_groups).length} contact groups`)

const twiml_ejs = fs.readFileSync(file_paths.twiml_ejs, { encoding: 'utf-8' })
const twiml_template = ejs.compile(twiml_ejs)

ensure_twilio_credentials_present(twilio_config)
console.info('CONFIG:', 'Twilio Account SID:', twilio_config.account_sid)
console.info('CONFIG:', 'Twilio Auth Token:', hide_inner_chars(twilio_config.auth_token))
console.info('CONFIG:', 'Twilio Phone Number:', twilio_config.phone_number)
console.info('CONFIG:', 'Twilio Timeout:', twilio_config.timeout)
console.info('CONFIG:', 'Twilio Log Level:', twilio_config.log_level)

const httpd_port = httpd_config.port
const httpd = express()
httpd.use(morgan('combined'))
httpd.use(bearerToken())
httpd.use(bodyParser.json())

const httpd_call_limiter = rateLimit({
  windowMs: httpd_config.rate_window_call,
  limit: httpd_config.rate_limit_call,
  standardHeaders: 'draft-8',
  skipFailedRequests: true,
})
httpd.use('/call', httpd_call_limiter)

console.info('CONFIG:', 'Express Port:', httpd_config.port)
console.info('CONFIG:', 'Express Bearer-Token:', hide_inner_chars(httpd_config.bearer_token))
console.info('CONFIG:', 'Express Rate-Window /call:', httpd_config.rate_window_call)
console.info('CONFIG:', 'Express Rate-Limit /call:', httpd_config.rate_limit_call)

httpd.post('/call/contact/:id', (request, response) => {
  const contact_id = request.params.id

  if (httpd_config.bearer_token.length !== 0) {
    if (request.token === undefined || request.token.length === 0) {
      response.status(401).json({ message: 'No Bearer Token provided', status: 401 })
      return
    } else if (request.token !== httpd_config.bearer_token) {
      response.status(403).json({ message: 'Invalid Bearer Token provided', status: 403 })
      return
    }
  }

  if (contact_id in contacts) {
    const contact = contacts[contact_id]
    const twiml = twiml_template(request.body)
    console.debug('HTTPD:', 'Rendered TwiML:', twiml)

    twilio_client.calls.create({
      from: twilio_config.phone_number,
      to: contact.phone_number,
      twiml: twiml,
    }).then((call_instance) => {
      console.info('TWILIO:', `Call from ${call_instance.from} to ${call_instance.to} with SID ${call_instance.sid} has status ${call_instance.status}`)
    }).catch((error) => {
      console.error('TWILIO:', 'Call Error:', error)
    })

    response.status(200).json({ message: 'Call created', call: { contact: contact }, status: 200 })
    return
  } else {
    response.status(404).json({ message: 'Contact not found', contact_id: contact_id, status: 404 })
    return
  }
})

httpd.post('/call/contact_group/:id', (request, response) => {
  const contact_group_id = request.params.id

  if (httpd_config.bearer_token.length !== 0) {
    if (request.token === undefined || request.token.length === 0) {
      response.status(401).json({ message: 'No Bearer Token provided', status: 401 })
      return
    } else if (request.token !== httpd_config.bearer_token) {
      response.status(403).json({ message: 'Invalid Bearer Token provided', status: 403 })
      return
    }
  }

  if (contact_group_id in contact_groups) {
    const contact_group = contact_groups[contact_group_id]
    const twiml = twiml_template(request.body)
    console.debug('HTTPD:', 'Rendered TwiML:', twiml)

    const contact_group_contacts: Array<Contact> = []
    for (const contact_id of contact_group) {
      const contact = contacts[contact_id]

      twilio_client.calls.create({
        from: twilio_config.phone_number,
        to: contact.phone_number,
        timeout: twilio_config.timeout,
        twiml: twiml,
      }).then((call_instance) => {
        console.info('TWILIO:', `Call from ${call_instance.from} to ${call_instance.to} with SID ${call_instance.sid} has status ${call_instance.status}`)
      }).catch((error) => {
        console.error('TWILIO:', 'Call Error:', error)
      })

      contact_group_contacts.push(contact)
    }

    response.status(200).json({ message: 'Calls created', calls: { contact_group: contact_group_contacts }, status: 200 })
    return
  } else {
    response.status(404).json({ message: 'Contact Group not found', contact_group_id: contact_group_id, status: 404 })
    return
  }
})

const httpd_listener = httpd.listen(httpd_port, () => {
  console.info('HTTPD:', `Listening on port ${httpd_port}`)
})

const twilio_client = twilioSDK(twilio_config.account_sid, twilio_config.auth_token, {
  logLevel: twilio_config.log_level,
})

const twilio_balance = twilio_client.balance
console.debug('TWILIO:', 'Account Balance:', twilio_balance)

process.on('SIGINT', () => {
  const promises: Array<Promise<boolean>> = []
  console.debug('')
  console.debug('SIGINT:', 'Processing signal')

  if (httpd_listener) {
    const httpd_promise = new Promise<boolean>((resolve) => {
      httpd_listener.close(() => {
        console.info('HTTPD:', 'Socket closed')
      })
      resolve(true)
    })
    promises.push(httpd_promise)
  }

  Promise.all(promises)
    .then(() => {
      process.exit(0)
    })
})

function hide_inner_chars(secret: string, outer_length: number = 5) {
  if (secret.length === 0) return ''
  return secret.slice(0, outer_length) + '...' + secret.slice(outer_length * -1)
}
