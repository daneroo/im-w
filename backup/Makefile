

all:
	@echo "im-weight backups.. check | head | resore"

# new endpoint supports /api/observations?digest
check:
	@echo md5sum: s3, vercel, vercel?digest, heroku, local-file
	@aws --profile im-dan s3 cp s3://im-weight/observationdata.json - | md5sum
	@curl -s https://weight.v.imetrical.com/api/observations | md5sum
	@curl -s 'https://weight.v.imetrical.com/api/observations?digest' | jq -r .ETag
	@curl -s https://im-weight.herokuapp.com/backup | md5sum
	@cat observationdata.json | md5sum

head:
	@echo md5sum: s3, vercel, heroku, local-file
	@aws --profile im-dan s3 cp s3://im-weight/observationdata.json - | jq .values[0]
	@curl -s https://weight.v.imetrical.com/api/observations | jq .values[0]
	@curl -s https://im-weight.herokuapp.com/backup | jq .values[0]
	@cat observationdata.json | jq .values[0]

restore:
	@echo aws --profile im-dan s3 cp observationdata.json s3://im-weight/observationdata.json