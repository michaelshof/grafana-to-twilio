import { Contacts, ContactGroups, FilePaths, TwilioConfig } from '../src/types'

import { ensure_file_paths_exist, ensure_contacts_valid, ensure_contact_groups_valid, ensure_twilio_credentials_present } from '../src/validations'

import { faker } from '@faker-js/faker';

describe('validations', () => {
  describe('ensure_file_paths_exist', () => {
    const file_paths: FilePaths = {
      contacts: '',
      contact_groups: '',
      twiml_ejs: '',
    }

    beforeEach(() => {
      file_paths.contacts = './config/contacts.json'
      file_paths.contact_groups = './config/contact_groups.json'
      file_paths.twiml_ejs = './config/twiml.xml.ejs'
    })

    it('works', () => {
      expect(ensure_file_paths_exist(file_paths)).toEqual(true)
    })
  })

  describe('ensure_contacts_valid', () => {
    const contacts: Contacts = {}

    beforeEach(() => {
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
    })
    afterEach(() => {
      for (const prop of Object.getOwnPropertyNames(contacts)) {
        delete contacts[prop];
      }
    })

    it('works', () => {
      expect(ensure_contacts_valid(contacts)).toEqual(true)
    })
  })

  describe('ensure_contact_groups_valid', () => {
    const contacts: Contacts = {}
    const contact_groups: ContactGroups = {}

    beforeEach(() => {
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
      contact_groups[contact_group_id3] = []
    })
    afterEach(() => {
      for (const prop of Object.getOwnPropertyNames(contact_groups)) {
        delete contact_groups[prop];
      }
      for (const prop of Object.getOwnPropertyNames(contacts)) {
        delete contacts[prop];
      }
    })

    it('works', () => {
      expect(ensure_contact_groups_valid(contact_groups, contacts)).toEqual(true)
    })
  })

  describe('ensure_twilio_credentials_present', () => {
    const twilio_config: TwilioConfig = {
      account_sid: '',
      auth_token: '',
      log_level: '',
      phone_number: '',
      timeout: NaN,
    }

    beforeEach(() => {
      twilio_config.account_sid = faker.string.hexadecimal({ length: 34 })
      twilio_config.auth_token = faker.string.hexadecimal({ length: 32 })
      twilio_config.log_level = 'debug'
      twilio_config.phone_number = faker.phone.number({ style: 'international' })
      twilio_config.timeout = faker.number.int({ min: 5, max: 50 })
    })

    it('works', () => {
      expect(ensure_twilio_credentials_present(twilio_config)).toEqual(true)
    })
  })
})
