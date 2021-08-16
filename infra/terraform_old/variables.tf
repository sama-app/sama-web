locals {
  region = "eu-central-1"

  env = yamldecode(file("./env/${terraform.workspace}/env.yaml"))

  origin_id = "web_origin_${terraform.workspace}"

  tags = {
    Environment = terraform.workspace
  }
}

