#!/bin/bash

# Get the Bluemix Org
ORG=${CF_ORG}

# Get the Bluemix App name
echo ${CF_APP}

# Replace non-alpha , non-numeric characters in Org name
ORG_ID=${ORG//[^a-zA-Z0-9_-]/-}

# Create a custom host based on App name and Org name
Host_ID=${CF_APP}"-"$ORG_ID
echo "Prepared to push using" $Host_ID

# Push using cf push <App-name> -n <custom_host_ID>
cf push ${CF_APP} -n $Host_ID

# View logs
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]
then
    cf logs ${CF_APP} --recent
    exit $EXIT_CODE
fi