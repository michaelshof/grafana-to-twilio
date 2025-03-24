import bodyParser from 'body-parser'
import express from 'express'
import bearerToken from 'express-bearer-token'
import { rateLimit } from 'express-rate-limit'
import morgan from 'morgan'
import { Twilio } from 'twilio'

import { httpd_config, twilio_config } from './configs'
import { Contact, Contacts, ContactGroups } from './types'

const httpd = express()
httpd.disable('jest')
httpd.use(bearerToken())
httpd.use(bodyParser.json())
if (process.env.NODE_ENV !== 'test') httpd.use(morgan('combined'))

const httpd_call_limiter = rateLimit({
  windowMs: httpd_config.rate_window_call,
  limit: httpd_config.rate_limit_call,
  standardHeaders: 'draft-8',
  skipFailedRequests: true,
})
httpd.use('/call', httpd_call_limiter)

httpd.post('/call/contact/:id', async (request, response) => {
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

  const contacts = httpd.get('contacts') as Contacts
  const twiml_template = httpd.get('twiml_template') as ejs.TemplateFunction
  const twilio_client = httpd.get('twilio_client') as Twilio

  if (contact_id in contacts) {
    const contact = contacts[contact_id]
    const twiml = twiml_template(request.body)
    console.debug('HTTPD:', 'Rendered TwiML:', twiml)

    const call_create_promise = twilio_client.calls.create({
      from: twilio_config.phone_number,
      to: contact.phone_number,
      timeout: contact.timeout || twilio_config.timeout,
      twiml: twiml,
    }).then((call_instance) => {
      console.info('TWILIO:', `Call from ${call_instance.from} to ${call_instance.to} with SID ${call_instance.sid} has status ${call_instance.status}`)
      return true
    }).catch((error) => {
      console.error('TWILIO:', 'Call Error:', error)
      return false
    })
    if (httpd.enabled('jest')) await call_create_promise

    response.status(200).json({ message: 'Call created', call: { contact: contact }, status: 200 })
    return
  } else {
    response.status(404).json({ message: 'Contact not found', contact_id: contact_id, status: 404 })
    return
  }
})

httpd.post('/call/contact_group/:id', async (request, response) => {
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

  const contacts = httpd.get('contacts') as Contacts
  const contact_groups = httpd.get('contact_groups') as ContactGroups
  const twiml_template = httpd.get('twiml_template') as ejs.TemplateFunction
  const twilio_client = httpd.get('twilio_client') as Twilio

  if (contact_group_id in contact_groups) {
    const contact_group = contact_groups[contact_group_id]
    const twiml = twiml_template(request.body)
    console.debug('HTTPD:', 'Rendered TwiML:', twiml)

    const contact_group_contacts: Array<Contact> = []
    for (const contact_id of contact_group) {
      const contact = contacts[contact_id]

      const call_create_promise = twilio_client.calls.create({
        from: twilio_config.phone_number,
        to: contact.phone_number,
        timeout: contact.timeout || twilio_config.timeout,
        twiml: twiml,
      }).then((call_instance) => {
        console.info('TWILIO:', `Call from ${call_instance.from} to ${call_instance.to} with SID ${call_instance.sid} has status ${call_instance.status}`)
        return true
      }).catch((error) => {
        console.error('TWILIO:', 'Call Error:', error)
        return false
      })
      if (httpd.enabled('jest')) await call_create_promise

      contact_group_contacts.push(contact)
    }

    response.status(200).json({ message: 'Calls created', calls: { contact_group: contact_group_contacts }, status: 200 })
    return
  } else {
    response.status(404).json({ message: 'Contact Group not found', contact_group_id: contact_group_id, status: 404 })
    return
  }
})

export default httpd
export { httpd }
