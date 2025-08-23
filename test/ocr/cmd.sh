#!/usr/bin/env sh

# run against backend api
curl -X 'POST' \
  'http://localhost:3000/api/receipt-ocr' \
  -H 'accept: application/json' \
  -H 'Content-Type: multipart/form-data' \
  -F 'file=@/home/oliver/Projects/bern/ocr-test/test.jpg;type=image/jpeg'

# run against docker
curl -X 'POST' \
  'http://localhost:8000/ocr/' \
  -H 'accept: application/json' \
  -H 'Content-Type: multipart/form-data' \
  -F 'file=@/home/oliver/Projects/bern/ocr-test/test.jpg;type=image/jpeg'
