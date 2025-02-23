#!/bin/sh

# Configure ngrok auth if token is provided
if [ -n "$NGROK_AUTHTOKEN" ]; then
    echo "Configuring ngrok auth..."
    ngrok config add-authtoken "$NGROK_AUTHTOKEN"
fi

# Execute the main command
exec "$@" 