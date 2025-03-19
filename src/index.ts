import fs from 'node:fs'

import timestampPatch from 'console-stamp'
import dotenv from 'dotenv'
import ejs from 'ejs'
import twilioSDK from 'twilio'

dotenv.config()
timestampPatch(console)

import httpd from './httpd'
import { Contacts, ContactGroups } from './types'
import { ensure_file_paths_exist, ensure_contacts_valid, ensure_contact_groups_valid, ensure_twilio_credentials_valid } from './validations'

import { file_paths, httpd_config, twilio_config } from './configs'

file_paths.contacts = fs.realpathSync(file_paths.contacts)
file_paths.contact_groups = fs.realpathSync(file_paths.contact_groups)
file_paths.twiml_ejs = fs.realpathSync(file_paths.twiml_ejs)

console.info('CONFIG:', 'File-Path Contacts:', file_paths.contacts)
console.info('CONFIG:', 'File-Path Contact Groups:', file_paths.contact_groups)
console.info('CONFIG:', 'File-Path TwiML EJS:', file_paths.twiml_ejs)

console.info('CONFIG:', 'Express Port:', httpd_config.port)
console.info('CONFIG:', 'Express Bearer-Token:', hide_inner_chars(httpd_config.bearer_token))
console.info('CONFIG:', 'Express Rate-Window /call:', httpd_config.rate_window_call)
console.info('CONFIG:', 'Express Rate-Limit /call:', httpd_config.rate_limit_call)

console.info('CONFIG:', 'Twilio Account SID:', twilio_config.account_sid)
console.info('CONFIG:', 'Twilio Auth Token:', hide_inner_chars(twilio_config.auth_token))
console.info('CONFIG:', 'Twilio Phone Number:', twilio_config.phone_number)
console.info('CONFIG:', 'Twilio Timeout:', twilio_config.timeout)
console.info('CONFIG:', 'Twilio Log Level:', twilio_config.log_level)

ensure_file_paths_exist(file_paths)
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

ensure_twilio_credentials_valid(twilio_config)
const twilio_client = twilioSDK(twilio_config.account_sid, twilio_config.auth_token, {
  logLevel: twilio_config.log_level,
})
const twilio_balance = twilio_client.balance
console.debug('TWILIO:', 'Account Balance:', twilio_balance)

httpd.set('contacts', contacts)
httpd.set('contact_groups', contact_groups)
httpd.set('twilio_client', twilio_client)
httpd.set('twiml_template', twiml_template)

const httpd_port = httpd_config.port
const httpd_listener = httpd.listen(httpd_port, () => {
  console.info('HTTPD:', `Listening on port ${httpd_port}`)
})

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
