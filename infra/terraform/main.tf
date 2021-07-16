provider "aws" {
  profile = "default"
  region  = local.region
}

##############
##### S3 #####
##############
resource "aws_s3_bucket" "site" {
  bucket = local.env.fqdn
  acl    = "public-read"

  website {
    index_document = "index.html"
    error_document = "index.html"
  }
}

module "source" {
  source   = "hashicorp/dir/template"
  base_dir = "../../build/"
}

resource "aws_s3_bucket_object" "destination" {
  for_each = module.source.files

  bucket = aws_s3_bucket.site.bucket
  acl    = "public-read"

  key          = each.key
  content_type = each.value.content_type
  source       = each.value.source_path
  etag         = each.value.digests.md5
}

######################
##### Cloudfront #####
######################


resource "aws_cloudfront_distribution" "site_distribution" {
  origin {
    domain_name = aws_s3_bucket.site.bucket_regional_domain_name
    origin_id   = local.origin_id
  }

  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"

  aliases = [local.env.fqdn]

  default_cache_behavior {
    allowed_methods  = ["HEAD", "GET", "OPTIONS"]
    cached_methods   = ["HEAD", "GET", "OPTIONS"]
    target_origin_id = local.origin_id

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = local.env.default_ttl
    max_ttl                = local.env.max_ttl
  }

  custom_error_response {
    error_caching_min_ttl = 86400
    error_code = 404
    response_code = 200
    response_page_path = "/index.html"
  }

  price_class = "PriceClass_200"

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  tags = local.tags

  viewer_certificate {
    acm_certificate_arn = local.env.certificate_arn
    ssl_support_method  = "sni-only"
  }
}