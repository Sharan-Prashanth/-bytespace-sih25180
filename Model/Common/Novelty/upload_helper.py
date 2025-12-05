"""
Small CLI helper to upload a JSON file (or stdin JSON) to Supabase storage using the project's novelty.upload_json_to_supabase helper.
Usage:
  python upload_helper.py --file path/to/file.json --bucket novelty-json --name optional_filename.json
  cat data.json | python upload_helper.py --stdin --bucket novelty-json --name optional.json

Requires environment variables: SUPABASE_URL, SUPABASE_KEY

"""

import argparse
import json
import sys
import os

# Ensure the novelty module can be imported
MODULE_PATH = os.path.dirname(__file__)
if MODULE_PATH not in sys.path:
    sys.path.insert(0, MODULE_PATH)

from novelty import upload_json_to_supabase


def main():
    p = argparse.ArgumentParser()
    p.add_argument('--file', type=str, help='Path to local JSON file to upload')
    p.add_argument('--stdin', action='store_true', help='Read JSON from stdin')
    p.add_argument('--bucket', type=str, default='novelty-json', help='Supabase storage bucket name')
    p.add_argument('--name', type=str, help='Filename to use in bucket (optional)')

    args = p.parse_args()

    if args.stdin:
        raw = sys.stdin.read()
        try:
            data = json.loads(raw)
        except Exception as e:
            print('Failed to parse JSON from stdin:', e)
            sys.exit(2)
    elif args.file:
        try:
            with open(args.file, 'r', encoding='utf-8') as f:
                data = json.load(f)
        except Exception as e:
            print('Failed to read file:', e)
            sys.exit(2)
    else:
        print('Either --file or --stdin is required')
        p.print_help()
        sys.exit(2)

    res = upload_json_to_supabase(bucket=args.bucket, filename=args.name, data=data)
    if res.get('success'):
        print('Upload successful')
        print('filename:', res.get('filename'))
        if res.get('public_url'):
            print('public_url:', res.get('public_url'))
        else:
            print('public_url: (not available - check bucket public settings)')
        sys.exit(0)
    else:
        print('Upload failed:', res.get('error'))
        sys.exit(1)


if __name__ == '__main__':
    main()
