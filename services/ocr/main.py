#!/usr/bin/env python3

from flask import Flask, request
import json
import re
import requests
import os

os.system('docker compose -f ./receipt-ocr/docker-compose.yml up -d')

app = Flask(__name__)

url = 'http://localhost:8000/ocr/'

OLLAMA_URL = 'http://bernhackt.runtimeoverflow.com:11434/api/generate'
PREFIX = 'the following text was scanned with ocr from a receipt.'

def strip(text):
    return text.replace('```json', '```').split('```')[1].split('```')[0]

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

    out = requests.post(url, headers=headers, files=files)
    ocr_json = out.json()
    ocr_text = ocr_json['result']

    print('ocr')
    print(ocr_text)

    _date = ollama(PREFIX + 'give the date only as json: ' + ocr_text)
    _amount = ollama(PREFIX + 'give the subtotal only as json: ' + ocr_text)
    _list = ollama(PREFIX + 'try to list the bought items with prices only as json: ' + ocr_text)

    print('ai')
    print(_date) 
    print(_amount)
    print(_list)

    _date = strip(_date)
    _amount = strip(_amount)
    _list = strip(_list)

    print('strip')
    print(_date)
    print(_amount)
    print(_list)

    d = ""
    try:
        d = json.loads(_date)['date']
    except:
        True

    a = ""
    try:
        a = json.loads(_amount)['subtotal']
    except:
        True

    l = ""
    try:
        l = json.loads(_list)
    except:
        True

    print(d, a, l)
    return {"date": d, "amount": a, "items": l}

app.run(host='127.0.0.1', port=8081)
