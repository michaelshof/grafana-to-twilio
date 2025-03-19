import fs from 'node:fs'

import dotenv from 'dotenv'
import ejs from 'ejs'
import twilioSDK from 'twilio'

import { faker } from '@faker-js/faker';
import request from 'supertest'

dotenv.config({ path: __dirname + '/.env' })

import httpd from '../src/httpd'
import { Contacts, ContactGroups } from '../src/types'

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
  let contact_id: string

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
    contact_id = faker.helpers.arrayElement(contact_groups[contact_group_id])
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

  describe('POST /call/contact_group/:id', () => {
    it('works with valid bearer token and contact group ID', (done) => {
      request(httpd)
        .post(`/call/contact_group/${contact_group_id}`)
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
  })

  describe('POST /call/contact/:id', () => {
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
  })
})
