import fs from 'node:fs'

import dotenv from 'dotenv'
import express from 'express'
import morgan from 'morgan'
import twilioSDK from 'twilio'

import { Contacts, ContactGroups } from './types'

dotenv.config()

const file_paths = {
  contacts: process.env.CONTACTS_FILE_PATH || './contacts.json',
  contact_groups: process.env.CONTACT_GROUPS_FILE_PATH || './contact_groups.json',
}
ensure_file_paths_exist(file_paths)

function ensure_file_paths_exist(file_paths: Record<string, string>) {
  for (const file_path_id in file_paths) {
    const file_path = file_paths[file_path_id]

    if (file_path.length === 0) {
      throw new Error(`${file_path_id} file path is not set`)
    }
    if (!fs.existsSync(file_path)) {
      throw new Error(`${file_path_id} file path does not exist: ${file_path}`)
    }
  }
}
const contacts_raw = JSON.parse(fs.readFileSync(file_paths.contacts, { encoding: 'utf-8' }))
const contact_groups_raw = JSON.parse(fs.readFileSync(file_paths.contact_groups, { encoding: 'utf-8' }))

const contacts = contacts_raw as Contacts
ensure_contacts_valid(contacts)
console.log('CONTACTS:', `Loaded ${Object.keys(contacts).length} contacts`)

const contact_groups = contact_groups_raw as ContactGroups
ensure_contact_groups_valid(contact_groups)
console.log('CONTACT-GROUPS:', `Loaded ${Object.keys(contact_groups).length} contact groups`)

function ensure_contacts_valid(contacts: Contacts) {
  if (Object.keys(contacts).length === 0) {
    throw new Error('No contacts defined')
  }
}

function ensure_contact_groups_valid(contact_groups: ContactGroups) {
  for (const contact_group_id in contact_groups) {
    const contact_group = contact_groups[contact_group_id]
    if (contact_group.length === 0) continue

    for (const contact_id of contact_group) {
      if (contact_id in contacts) continue

      throw new Error(`Unknown contact ${contact_id} in contact group ${contact_group_id}`)
    }
  }
}

const httpd_config = {
  port: process.env.HTTPD_PORT ? parseInt(process.env.HTTPD_PORT) : 3000,
}

const httpd_port = httpd_config.port
const httpd = express()
httpd.use(morgan('combined'))

httpd.post('/call/contact/:id', (request, response) => {
  const contact_id = request.params.id

  if (contact_id in contacts) {
    const contact = contacts[contact_id]

    response.status(200).json({ message: 'Contact found', contact: contact, status: 200 })
  } else {
    response.status(404).json({ message: 'Contact not found', status: 404 })
  }
})

httpd.post('/call/contact_group/:id', (request, response) => {
  const contact_group_id = request.params.id

  if (contact_group_id in contact_groups) {
    const contact_group = contact_groups[contact_group_id]

    response.status(200).json({ message: 'Contact found', contact_group: contact_group, status: 200 })
  } else {
    response.status(404).json({ message: 'Contact not found', status: 404 })
  }
})

const httpd_listener = httpd.listen(httpd_port, () => {
  console.log('HTTPD:', `Listening on port ${httpd_port}`)
})

const twilio_config = {
  account_sid: process.env.TWILIO_ACCOUNT_SID || '',
  auth_token: process.env.TWILIO_AUTH_TOKEN || '',
  log_level: 'debug',
}
const twilio_client = twilioSDK(twilio_config.account_sid, twilio_config.auth_token, {
  logLevel: twilio_config.log_level,
})

const twilio_balance = twilio_client.balance
console.log('TWILIO:', 'Account Balance:', twilio_balance)

process.on('SIGINT', () => {
  const promises: Array<Promise<boolean>> = []
  console.log('')
  console.log('SIGINT:', 'Processing signal')

  if (httpd_listener) {
    const httpd_promise = new Promise<boolean>((resolve) => {
      httpd_listener.close(() => {
        console.log('HTTPD:', 'Socket closed')
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
