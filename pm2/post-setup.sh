mkdir --parents ../shared/config

touch     ../shared/.env ../shared/ecosystem.config.js ../shared/config/contact_groups.json ../shared/config/contacts.json ../shared/config/twiml.xml.ejs || exit 2
chmod o-r ../shared/.env ../shared/ecosystem.config.js ../shared/config/contact_groups.json ../shared/config/contacts.json ../shared/config/twiml.xml.ejs || exit 3

exit 0
