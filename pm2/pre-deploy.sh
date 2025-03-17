if ! [ -f /srv/grafana-to-twilio/shared/.env ]; then
	ln -s /srv/grafana-to-twilio/shared/.env .env || exit 1
fi
if ! [ -f /srv/grafana-to-twilio/shared/ecosystem.config.js ]; then
	ln -s /srv/grafana-to-twilio/shared/ecosystem.config.js ecosystem.config.js || exit 2
fi
if ! [ -d /srv/grafana-to-twilio/shared/config ]; then
	ln -s /srv/grafana-to-twilio/shared/config config || exit 3
fi

exit 0
