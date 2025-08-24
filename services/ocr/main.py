#!/usr/bin/env python3

from flask import Flask, request
import json
import re
import requests
import os

os.system('docker compose -f ./receipt-ocr/docker-compose.yml up -d')

app = Flask(__name__)

OCR_URL = 'http://localhost:8000/ocr/'

OLLAMA_URL = 'http://bernhackt.runtimeoverflow.com:11434/api/generate'
PREFIX = 'the following text was scanned with ocr from a receipt.'

def strip(text):
    return text.replace('```json', '```').split('```')[1].split('```')[0]

def try_get_key(obj, key):
    res = None

    try:
        res = obj[key]
    except:
        True

    return res

def try_to_json(text):
    print(text)
    text = strip(text)
    print(text)

    res = None
    try:
        res = json.loads(text)
    except:
        True

    return res

def ollama(text):
    data = {
        'model': 'llama3.1:8b',
        'prompt': text
    }
    response = requests.post(OLLAMA_URL, json=data)
    text = ''.join(map(lambda e: e['response'], map(json.loads, response.text.split('\n')[0:-1])))
    return text

@app.route('/receipt-ocr', methods=['POST'])
def result():
    print("req")

    image = request.files['file']
    headers = {
        'accept': 'application/json',
        # 'Content-Type': 'multipart/form-data'
    }
    files = {
        'file': ('test.jpg', image, 'image/jpeg')
        # 'file': image
    }

    out = requests.post(OCR_URL, headers=headers, files=files)
    ocr_json = out.json()
    ocr_text = ocr_json['result']

    print('ocr')
    print(ocr_text)

    _date = ollama(PREFIX + 'give the date only as json: ' + ocr_text)
    _amount = ollama(PREFIX + 'give the subtotal only as json: ' + ocr_text)
    _list = ollama(PREFIX + 'try to list the bought items with prices only as json: ' + ocr_text)

    print('ai')
    d = try_get_key(try_to_json(_date), 'date')
    a = try_get_key(try_to_json(_amount), 'subtotal')
    l = try_to_json(_list)

    print(d, a, l)
    return {"date": d, "amount": a, "items": l}

app.run(host='127.0.0.1', port=8081)
