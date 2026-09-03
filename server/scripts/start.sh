#!/bin/sh
# Container entrypoint for the Render deploy: apply pending migrations, then
# start the API. Kept as a script because Render's dockerCommand does not run
# through a shell, so "a && b" there does not work.
set -e

npm run db:deploy --workspace server
exec node server/src/server.js
