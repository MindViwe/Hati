#!/bin/bash
if [ -z "$1" ]; then
    echo "Usage: $0 <IP_ADDRESS>"
    echo "Example: $0 192.168.1.100"
    exit 1
fi

IP=$1
echo "Updating API URLs to use IP: $IP"

# Update all localhost references to the new IP
find www -name "*.ts" -o -name "*.js" -o -name "*.tsx" -o -name "*.jsx" | xargs sed -i "s/localhost/$IP/g"

echo "Updated all files to use IP: $IP"
