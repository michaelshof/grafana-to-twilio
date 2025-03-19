import fs from 'node:fs'

import { Contacts, ContactGroups, TwilioConfig, FilePaths } from './types'

function ensure_file_paths_exist(file_paths: FilePaths) {
  for (const file_path_id in file_paths) {
    const file_path = file_paths[file_path_id as keyof FilePaths]

    if (file_path.length === 0) {
      throw new Error(`${file_path_id} file path is not set`)
    }
    if (!fs.existsSync(file_path)) {
      throw new Error(`${file_path_id} file path does not exist: ${file_path}`)
    }
  }
  return true
}

function ensure_contacts_valid(contacts: Contacts) {
  if (Object.keys(contacts).length === 0) throw new Error('No contacts defined')

  for (const contact_id in contacts) {
    const contact = contacts[contact_id]
    if (!contact.phone_number.startsWith('+')) throw new Error(`Phone number not in international format: ${contact.phone_number}`)
  }
  return true
}

function ensure_contact_groups_valid(contact_groups: ContactGroups, contacts: Contacts) {
  for (const contact_group_id in contact_groups) {
    const contact_group = contact_groups[contact_group_id]
    if (contact_group.length === 0) throw new Error(`Contact group ${contact_group_id} is empty`)

    for (const contact_id of contact_group) {
      if (contact_id in contacts) continue

      throw new Error(`Unknown contact ${contact_id} in contact group ${contact_group_id}`)
    }
  }
  return true
}

function ensure_twilio_credentials_valid(twilio_config: TwilioConfig) {
  if (twilio_config.account_sid.length === 0) throw new Error('Missing Twilio Account SID')
  if (twilio_config.auth_token.length === 0) throw new Error('Missing Twilio Auth Token')
  if (twilio_config.phone_number.length === 0) throw new Error('Missing Twilio Phone Number')

  if (!twilio_config.phone_number.startsWith('+')) throw new Error(`Twilio Phone Number not in international format: ${twilio_config.phone_number}`)
  return true
}

export default { ensure_file_paths_exist, ensure_contacts_valid, ensure_contact_groups_valid, ensure_twilio_credentials_valid: ensure_twilio_credentials_valid }
export { ensure_file_paths_exist, ensure_contacts_valid, ensure_contact_groups_valid, ensure_twilio_credentials_valid as ensure_twilio_credentials_valid }
