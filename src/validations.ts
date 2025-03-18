import fs from 'node:fs'

import { Contacts, ContactGroups, TwilioConfig, FilePaths } from './types'

function ensure_file_paths_exist(file_paths: FilePaths) {
  const any_paths = file_paths as any as Record<string, string>
  for (const file_path_id in any_paths) {
    const file_path = any_paths[file_path_id]

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
  return true
}

function ensure_contact_groups_valid(contact_groups: ContactGroups, contacts: Contacts) {
  for (const contact_group_id in contact_groups) {
    const contact_group = contact_groups[contact_group_id]
    if (contact_group.length === 0) continue

    for (const contact_id of contact_group) {
      if (contact_id in contacts) continue

      throw new Error(`Unknown contact ${contact_id} in contact group ${contact_group_id}`)
    }
  }
  return true
}

function ensure_twilio_credentials_present(twilio_config: TwilioConfig) {
  if (twilio_config.account_sid.length === 0) throw new Error('Missing Twilio Account SID')
  if (twilio_config.auth_token.length === 0) throw new Error('Missing Twilio Auth Token')
  if (twilio_config.phone_number.length === 0) throw new Error('Missing Twilio Phone Number')
  return true
}

export default { ensure_file_paths_exist, ensure_contacts_valid, ensure_contact_groups_valid, ensure_twilio_credentials_present }
export { ensure_file_paths_exist, ensure_contacts_valid, ensure_contact_groups_valid, ensure_twilio_credentials_present }
