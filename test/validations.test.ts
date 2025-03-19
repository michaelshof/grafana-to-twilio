import { Contacts, ContactGroups, FilePaths, TwilioConfig, TwilioCredentials } from '../src/types'

import { ensure_file_paths_exist, ensure_contacts_valid, ensure_contact_groups_valid, ensure_twilio_credentials_valid } from '../src/validations'

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

    it('works with existing file paths', () => {
      expect(ensure_file_paths_exist(file_paths)).toEqual(true)
    })

    describe('with only one file path empty', () => {
      beforeEach(() => {
        const file_path_ids = Object.getOwnPropertyNames(file_paths)
        const file_path_id = faker.helpers.arrayElement(file_path_ids) as keyof FilePaths

        file_paths[file_path_id] = ''
      })

      it('raises an error', () => {
        expect(() => { ensure_file_paths_exist(file_paths) }).toThrow('is not set')
      })
    })

    describe('with only one file path not existing', () => {
      beforeEach(() => {
        const file_path_ids = Object.getOwnPropertyNames(file_paths)
        const file_path_id = faker.helpers.arrayElement(file_path_ids) as keyof FilePaths

        file_paths[file_path_id] = faker.system.filePath()
      })

      it('raises an error', () => {
        expect(() => { ensure_file_paths_exist(file_paths) }).toThrow('does not exist')
      })
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

    it('works with valid contacts', () => {
      expect(ensure_contacts_valid(contacts)).toEqual(true)
    })

    describe('with human-style phone number', () => {
      beforeEach(() => {
        const contact_ids = Object.keys(contacts)
        const contact_id = faker.helpers.arrayElement(contact_ids)

        contacts[contact_id].phone_number = faker.phone.number({ style: 'human' })
      })

      it('raises an error', () => {
        expect(() => { ensure_contacts_valid(contacts) }).toThrow('international')
      })
    })

    describe('with national-style phone number', () => {
      beforeEach(() => {
        const contact_ids = Object.keys(contacts)
        const contact_id = faker.helpers.arrayElement(contact_ids)

        contacts[contact_id].phone_number = faker.phone.number({ style: 'national' })
      })

      it('raises an error', () => {
        expect(() => { ensure_contacts_valid(contacts) }).toThrow('international')
      })
    })

    describe('with contacts empty', () => {
      const contacts: Contacts = {}

      it('raises an error', () => {
        expect(() => { ensure_contacts_valid(contacts) }).toThrow('No contacts')
      })
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
      const contact_id4 = faker.string.uuid()
      contacts[contact_id4] = {
        phone_number: faker.phone.number({ style: 'international' })
      }
      const contact_group_id1 = faker.string.uuid()
      contact_groups[contact_group_id1] = [ contact_id1, contact_id2 ]
      const contact_group_id2 = faker.string.uuid()
      contact_groups[contact_group_id2] = [ contact_id2, contact_id3 ]
      const contact_group_id3 = faker.string.uuid()
      contact_groups[contact_group_id3] = [ contact_id4 ]
    })
    afterEach(() => {
      for (const prop of Object.getOwnPropertyNames(contact_groups)) {
        delete contact_groups[prop];
      }
      for (const prop of Object.getOwnPropertyNames(contacts)) {
        delete contacts[prop];
      }
    })

    it('works with valid contact groups', () => {
      expect(ensure_contact_groups_valid(contact_groups, contacts)).toEqual(true)
    })

    describe('with only one unknown contact ID', () => {
      beforeEach(() => {
        const contact_group_ids = Object.getOwnPropertyNames(contact_groups)
        const contact_group_id = faker.helpers.arrayElement(contact_group_ids)

        const unknow_contact_id = faker.string.uuid()
        contact_groups[contact_group_id].push(unknow_contact_id)
      })

      it('raises an error', () => {
        expect(() => { ensure_contact_groups_valid(contact_groups, contacts) }).toThrow('Unknown contact')
      })
    })

    describe('wit only one empty contact group', () => {
      beforeEach(() => {
        const contact_group_ids = Object.getOwnPropertyNames(contact_groups)
        const contact_group_id = faker.helpers.arrayElement(contact_group_ids)

        contact_groups[contact_group_id].length = 0
      })

      it('raises an error', () => {
        expect(() => { ensure_contact_groups_valid(contact_groups, contacts) }).toThrow('is empty')
      })
    })

    describe('without contact groups', () => {
      const contact_groups: ContactGroups = {}

      it('works', () => {
        expect(ensure_contact_groups_valid(contact_groups, contacts)).toEqual(true)
      })
    })
  })

  describe('ensure_twilio_credentials_valid', () => {
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

    it('works with valid credentials', () => {
      expect(ensure_twilio_credentials_valid(twilio_config)).toEqual(true)
    })

    describe('with only one credentials part empty', () => {
      beforeEach(() => {
        const credential_keys = ['account_sid', 'auth_token', 'phone_number']
        const credential_key = faker.helpers.arrayElement(credential_keys) as keyof TwilioCredentials

        twilio_config[credential_key] = ''
      })

      it('raises an error', () => {
        expect(() => { ensure_twilio_credentials_valid(twilio_config) }).toThrow('Missing Twilio')
      })
    })

    describe('with human-style phone number', () => {
      beforeEach(() => {
        twilio_config.phone_number = faker.phone.number({ style: 'human' })
      })

      it('raises an error', () => {
        expect(() => { ensure_twilio_credentials_valid(twilio_config) }).toThrow('international')
      })
    })

    describe('with national-style phone number', () => {
      beforeEach(() => {
        twilio_config.phone_number = faker.phone.number({ style: 'national' })
      })

      it('raises an error', () => {
        expect(() => { ensure_twilio_credentials_valid(twilio_config) }).toThrow('international')
      })
    })
  })
})
