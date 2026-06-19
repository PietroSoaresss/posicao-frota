#!/usr/bin/env bash
#
# Production launcher for the PAVI API on EC2.
#
# Pulls runtime secrets from AWS Secrets Manager (single JSON secret holding
# every credential), exports them as environment variables, then launches the
# Spring Boot fat jar with the "prod" profile.
#
# Required EC2 setup:
#   - IAM instance role with secretsmanager:GetSecretValue on the secret ARN.
#   - AWS CLI v2 and jq installed.
#   - JAR available at $PAVI_API_JAR (defaults to /opt/pavi/pavi-api.jar).
#
# The expected Secrets Manager secret is a JSON object such as:
#   {
#     "JWT_SECRET": "...",
#     "DATABASE_URL": "jdbc:postgresql://pavi.xxx.rds.amazonaws.com:5432/pavi",
#     "DATABASE_USERNAME": "pavi_app",
#     "DATABASE_PASSWORD": "...",
#     "SASCAR_USER": "...",
#     "SASCAR_PASSWORD": "...",
#     "APP_CORS_ALLOWED_ORIGINS": "https://app.pavi.com.br"
#   }
#
# Override these via the environment if you split the JSON differently:
set -euo pipefail

: "${PAVI_SECRET_ID:?must be set to the Secrets Manager secret name/ARN}"
: "${AWS_REGION:?must be set, e.g. us-east-1}"

PAVI_API_JAR="${PAVI_API_JAR:-/opt/pavi/pavi-api.jar}"

if [[ ! -r "$PAVI_API_JAR" ]]; then
  echo "FATAL: jar not found at $PAVI_API_JAR" >&2
  exit 1
fi

echo "Fetching $PAVI_SECRET_ID from Secrets Manager ($AWS_REGION)..."
SECRET_JSON="$(
  aws secretsmanager get-secret-value \
    --region "$AWS_REGION" \
    --secret-id "$PAVI_SECRET_ID" \
    --query SecretString \
    --output text
)"

# Export each top-level key as an environment variable. Spring reads them
# through ${VAR} placeholders in application-prod.properties.
while IFS='=' read -r key value; do
  [[ -z "$key" ]] && continue
  export "$key=$value"
done < <(echo "$SECRET_JSON" | jq -r 'to_entries|map("\(.key)=\(.value)")|.[]')

export SPRING_PROFILES_ACTIVE=prod

exec java \
  -Dfile.encoding=UTF-8 \
  -XX:+UseG1GC \
  -XX:MaxRAMPercentage=75.0 \
  -jar "$PAVI_API_JAR"
