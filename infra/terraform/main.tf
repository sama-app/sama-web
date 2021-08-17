provider "aws" {
  profile = "default"
  region  = local.region
}

##############
##### S3 #####
##############

resource "aws_s3_bucket" "site" {
  bucket = local.env.fqdn
  acl    = "private"
  policy = data.aws_iam_policy_document.site_bucket_policy.json

  website {
    index_document = "index.html"
    error_document = "index.html"
  }
}

resource "aws_s3_bucket" "legacy_redirect" {
  bucket = local.env.legacy_fqdn
  acl    = "private"
  policy = data.aws_iam_policy_document.redirect_bucket_policy.json

  website {
    redirect_all_requests_to = aws_s3_bucket.site.bucket_domain_name
  }
}

module "source" {
  source   = "hashicorp/dir/template"
  base_dir = "../../build/"
}

resource "aws_s3_bucket_object" "destination" {
  for_each = module.source.files

  bucket = aws_s3_bucket.site.bucket
  acl    = "private"

  key          = each.key
  content_type = each.value.content_type
  source       = each.value.source_path
  etag         = each.value.digests.md5
}

data "aws_iam_policy_document" "site_bucket_policy" {
  statement {
    sid       = "1"
    actions   = ["s3:GetObject", ]
    resources = ["arn:aws:s3:::${local.env.fqdn}/*", ]
    principals {
      type        = "AWS"
      identifiers = [aws_cloudfront_origin_access_identity.site_access_identity.iam_arn]
    }
  }
}

data "aws_iam_policy_document" "redirect_bucket_policy" {
  statement {
    sid       = "1"
    actions   = ["s3:GetObject", ]
    resources = ["arn:aws:s3:::${local.env.legacy_fqdn}/*", ]

    principals {
      type        = "AWS"
      identifiers = [aws_cloudfront_origin_access_identity.site_access_identity.iam_arn]
    }
  }
}

resource "aws_cloudfront_origin_access_identity" "site_access_identity" {
  comment = "s3-${local.env.fqdn}"
}