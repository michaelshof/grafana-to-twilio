import fs from 'node:fs'

import dotenv from 'dotenv'
import ejs from 'ejs'
import twilioSDK from 'twilio'

import { faker } from '@faker-js/faker';
import request from 'supertest'

dotenv.config({ path: __dirname + '/.env' })

import { twilio_config } from '../src/configs';
import httpd from '../src/httpd'
import { Contacts, ContactGroups, Contact, ContactGroup } from '../src/types'
import { CallInstance } from 'twilio/lib/rest/api/v2010/account/call';

describe('httpd', () => {
  const httpd_bearer_token = process.env.HTTPD_BEARER_TOKEN || ''

  const contacts: Contacts = {}
  const contact_groups: ContactGroups = {}

  const twiml_ejs = fs.readFileSync(__dirname + '/config/twiml.xml.ejs', { encoding: 'utf-8' })
  const twiml_template = ejs.compile(twiml_ejs)
  const twilio_client = twilioSDK(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN, {
    logLevel: 'debug',
  })

  let contact_group_id: string
  let contact_group: ContactGroup
  let contact_id: string
  let contact: Contact

  beforeEach(() => {
    httpd.enable('jest')
    httpd.set('contacts', contacts)
    httpd.set('contact_groups', contact_groups)
    httpd.set('twiml_template', twiml_template)
    httpd.set('twilio_client', twilio_client)

    const contact_id1 = faker.string.uuid()
    contacts[contact_id1] = {
      phone_number: faker.phone.number({ style: 'international' })
    }
    const contact_id2 = faker.string.uuid()
    contacts[contact_id2] = {
      phone_number: faker.phone.number({ style: 'international' })
    }
    const contact_id3 = faker.string.uuid()
    contacts[contact_id3] = {
      phone_number: faker.phone.number({ style: 'international' })
    }
    const contact_group_id1 = faker.string.uuid()
    contact_groups[contact_group_id1] = [ contact_id1, contact_id2 ]
    const contact_group_id2 = faker.string.uuid()
    contact_groups[contact_group_id2] = [ contact_id2, contact_id3 ]
    const contact_group_id3 = faker.string.uuid()
    contact_groups[contact_group_id3] = [ contact_id3 ]

    contact_group_id = faker.helpers.arrayElement(Object.getOwnPropertyNames(contact_groups))
    contact_group = contact_groups[contact_group_id]
    contact_id = faker.helpers.arrayElement(contact_groups[contact_group_id])
    contact = contacts[contact_id]
  })
  afterEach(() => {
    for (const prop of Object.getOwnPropertyNames(contact_groups)) {
      delete contact_groups[prop];
    }
    for (const prop of Object.getOwnPropertyNames(contacts)) {
      delete contacts[prop];
    }

    httpd.set('contacts', undefined)
    httpd.set('contact_groups', undefined)
    httpd.set('twiml_template', undefined)
    httpd.set('twilio_client', undefined)
    httpd.disable('jest')
  })

  describe('POST /call/contact/:id', () => {
    it('works with valid bearer token and contact ID', (done) => {
      request(httpd)
        .post(`/call/contact/${contact_id}`)
        .auth(httpd_bearer_token, { type: 'bearer' })
        .expect('Content-Type', 'application/json; charset=utf-8')
        .expect(200, done)
    })

    describe('without a bearer token', () => {
      it('returns status 401', (done) => {
        request(httpd)
          .post(`/call/contact/${contact_id}`)
          .expect('Content-Type', 'application/json; charset=utf-8')
          .expect(401, done)
      })
    })

    describe('with empty bearer token', () => {
      const httpd_bearer_token = ''

      it('returns status 401', (done) => {
        request(httpd)
          .post(`/call/contact/${contact_id}`)
          .auth(httpd_bearer_token, { type: 'bearer' })
          .expect('Content-Type', 'application/json; charset=utf-8')
          .expect(401, done)
      })
    })

    describe('with invalid bearer token', () => {
      const httpd_bearer_token = faker.string.uuid()

      it('returns status 403', (done) => {
        request(httpd)
          .post(`/call/contact/${contact_id}`)
          .auth(httpd_bearer_token, { type: 'bearer' })
          .expect('Content-Type', 'application/json; charset=utf-8')
          .expect(403, done)
      })
    })

    describe('with invalid contact ID', () => {
      beforeEach(() => {
        contact_id = faker.string.uuid()
      })

      it('returns status 404', (done) => {
        request(httpd)
          .post(`/call/contact/${contact_id}`)
          .auth(httpd_bearer_token, { type: 'bearer' })
          .expect('Content-Type', 'application/json; charset=utf-8')
          .expect(404, done)
      })
    })

    describe('twilio call creation', () => {
      let spy_create: jest.SpyInstance<Promise<CallInstance>>

      beforeEach(() => {
        spy_create = jest.spyOn(twilio_client.calls, 'create')
      })
      afterEach(() => {
        jest.restoreAllMocks()
      })

      it('uses the phone number of the contact', () => {
        return request(httpd)
          .post(`/call/contact/${contact_id}`)
          .auth(httpd_bearer_token, { type: 'bearer' })
          .expect(200)
          .then(() => {
            expect(contact.phone_number.length).toBeGreaterThan(8)
            expect(spy_create).toHaveBeenCalledWith(expect.objectContaining({ to: contact.phone_number }))
          })
      })

      it('uses the configured phone number', () => {
        return request(httpd)
          .post(`/call/contact/${contact_id}`)
          .auth(httpd_bearer_token, { type: 'bearer' })
          .expect(200)
          .then(() => {
            expect(twilio_config.phone_number.length).toBeGreaterThan(8)
            expect(spy_create).toHaveBeenCalledWith(expect.objectContaining({ from: twilio_config.phone_number }))
          })
      })

      it('uses the configured timeout', () => {
        return request(httpd)
          .post(`/call/contact/${contact_id}`)
          .auth(httpd_bearer_token, { type: 'bearer' })
          .expect(200)
          .then(() => {
            expect(spy_create).toHaveBeenCalledWith(expect.objectContaining({ timeout: twilio_config.timeout }))
          })
      })

      it('uses the timeout of the contact if present', () => {
        contact.timeout = faker.number.int({ min: 3, max: 600 })

        return request(httpd)
          .post(`/call/contact/${contact_id}`)
          .auth(httpd_bearer_token, { type: 'bearer' })
          .expect(200)
          .then(() => {
            expect(spy_create).toHaveBeenCalledWith(expect.objectContaining({ timeout: contact.timeout }))
          })
      })
    })
  })

  describe('POST /call/contact_group/:id', () => {
    it('works with valid bearer token and contact ID', (done) => {
      request(httpd)
        .post(`/call/contact_group/${contact_group_id}`)
        .auth(httpd_bearer_token, { type: 'bearer' })
        .expect('Content-Type', 'application/json; charset=utf-8')
        .expect(200, done)
    })

    describe('without a bearer token', () => {
      it('returns status 401', (done) => {
        request(httpd)
          .post(`/call/contact_group/${contact_group_id}`)
          .expect('Content-Type', 'application/json; charset=utf-8')
          .expect(401, done)
      })
    })

    describe('with empty bearer token', () => {
      const httpd_bearer_token = ''

      it('returns status 401', (done) => {
        request(httpd)
          .post(`/call/contact_group/${contact_group_id}`)
          .auth(httpd_bearer_token, { type: 'bearer' })
          .expect('Content-Type', 'application/json; charset=utf-8')
          .expect(401, done)
      })
    })

    describe('with invalid bearer token', () => {
      const httpd_bearer_token = faker.string.uuid()

      it('returns status 403', (done) => {
        request(httpd)
          .post(`/call/contact_group/${contact_group_id}`)
          .auth(httpd_bearer_token, { type: 'bearer' })
          .expect('Content-Type', 'application/json; charset=utf-8')
          .expect(403, done)
      })
    })

    describe('with invalid contact group ID', () => {
      beforeEach(() => {
        contact_group_id = faker.string.uuid()
      })

      it('returns status 404', (done) => {
        request(httpd)
          .post(`/call/contact_group/${contact_group_id}`)
          .auth(httpd_bearer_token, { type: 'bearer' })
          .expect('Content-Type', 'application/json; charset=utf-8')
          .expect(404, done)
      })
    })

    describe('twilio call creation', () => {
      let spy_create: jest.SpyInstance<Promise<CallInstance>>
      let group_contacts: Array<Contact>

      beforeEach(() => {
        spy_create = jest.spyOn(twilio_client.calls, 'create')
        group_contacts = contact_group.map((contact_id) => { return contacts[contact_id] })
      })
      afterEach(() => {
        jest.restoreAllMocks()
      })

      it('uses the phone number of the contact', () => {
        return request(httpd)
          .post(`/call/contact_group/${contact_group_id}`)
          .auth(httpd_bearer_token, { type: 'bearer' })
          .expect(200)
          .then(() => {
            for (const group_contact of group_contacts) {
              expect(group_contact.phone_number.length).toBeGreaterThan(8)
              expect(spy_create).toHaveBeenCalledWith(expect.objectContaining({ to: group_contact.phone_number }))
            }
          })
      })

      it('uses the configured phone number', () => {
        return request(httpd)
          .post(`/call/contact_group/${contact_group_id}`)
          .auth(httpd_bearer_token, { type: 'bearer' })
          .expect(200)
          .then(() => {
            expect(twilio_config.phone_number.length).toBeGreaterThan(8)
            for (const group_contact of group_contacts) {
              expect(spy_create).toHaveBeenCalledWith(expect.objectContaining({ from: twilio_config.phone_number }))
            }
          })
      })

      it('uses the configured timeout', () => {
        return request(httpd)
          .post(`/call/contact_group/${contact_group_id}`)
          .auth(httpd_bearer_token, { type: 'bearer' })
          .expect(200)
          .then(() => {
            for (const group_contact of group_contacts) {
              expect(spy_create).toHaveBeenCalledWith(expect.objectContaining({ timeout: twilio_config.timeout }))
            }
          })
      })

      it('uses the timeout of the contact if present', () => {
        contact.timeout = faker.number.int({ min: 3, max: 600 })

        return request(httpd)
          .post(`/call/contact_group/${contact_group_id}`)
          .auth(httpd_bearer_token, { type: 'bearer' })
          .expect(200)
          .then(() => {
            for (const group_contact of group_contacts) {
              if (group_contact.timeout) {
                expect(spy_create).toHaveBeenCalledWith(expect.objectContaining({ timeout: contact.timeout }))
              } else {
                expect(spy_create).toHaveBeenCalledWith(expect.objectContaining({ timeout: twilio_config.timeout }))
              }
            }
          })
      })
    })
  })
})
