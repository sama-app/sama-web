SHELL=bash

clean:
	@echo "Cleaning..."
	@rm -rf build/ node_modules/

build: clean
	@echo "Building..."
	@cp .env.$(ENV) .env
	@npm install
	@npm run build
	@rm .env
	@echo "Done..."

terraform-init:
	@terraform -chdir=infra/terraform init -input=false
	@terraform -chdir=infra/terraform workspace new $(ENV) ||:

deploy:
	@echo "Deploying $(ENV)..."
	@terraform -chdir=infra/terraform workspace select $(ENV)
	@terraform -chdir=infra/terraform apply -auto-approve
	@echo "Done..."

# Only for production deployments
invalidate-caches:
ifeq ($(ENV),prod)
	@echo "Invalidating CloudFront caches..."
	@aws cloudfront create-invalidation --distribution-id E2AXFGBZJHELAW --paths "/*"
	@echo "Done..."
endif

release: build deploy invalidate-caches