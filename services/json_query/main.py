import requests
from fastapi import FastAPI
from pydantic import BaseModel
import jmespath
import uvicorn
import json

API_TOKEN = ''

instruction = '''
You will need to query a JSON file using JMESPath to get the result. The JSON follows the following schema:
```
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Generated schema for Root",
  "type": "object",
  "properties": {
    "bankAccounts": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string"
          },
          "name": {
            "type": "string"
          },
          "type": {
            "type": "string"
          },
          "currentBalance": {
            "type": "number"
          },
          "currency": {
            "type": "string"
          },
          "transactions": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "id": {
                  "type": "string"
                },
                "amount": {
                  "type": "number"
                },
                "date": {
                  "type": "string"
                },
                "category": {
                  "type": "string"
                },
                "receiptId": {
                  "type": "string"
                },
                "balance": {
                  "type": "number"
                },
                "_mcp": {
                  "type": "boolean"
                },
                "_category_id": {
                  "type": "string"
                },
                "_category_label": {
                  "type": "string"
                }
              },
              "required": [
                "id",
                "amount",
                "date",
                "category",
                "receiptId",
                "balance"
              ]
            }
          },
          "recurrentPayments": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "id": {
                  "type": "string"
                },
                "amount": {
                  "type": "number"
                },
                "name": {
                  "type": "string"
                },
                "category": {
                  "type": "string"
                },
                "frequency": {
                  "type": "string"
                },
                "startDate": {
                  "type": "string"
                },
                "autoPay": {
                  "type": "boolean"
                }
              },
              "required": [
                "id",
                "amount",
                "name",
                "category",
                "frequency",
                "startDate",
                "autoPay"
              ]
            }
          }
        },
        "required": [
          "id",
          "name",
          "type",
          "currentBalance",
          "currency",
          "transactions",
          "recurrentPayments"
        ]
      }
    },
    "receipts": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string"
          },
          "description": {
            "type": "string"
          },
          "merchant": {
            "type": "string"
          },
          "location": {
            "type": "object",
            "properties": {
              "latitude": {
                "type": "number"
              },
              "longitude": {
                "type": "number"
              }
            },
            "required": [
              "latitude",
              "longitude"
            ]
          },
          "tags": {
            "type": "array",
            "items": {
              "type": "string"
            }
          }
        },
        "required": [
          "id",
          "description",
          "merchant",
          "location"
        ]
      }
    },
    "savingsProfiles": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string"
          },
          "name": {
            "type": "string"
          },
          "currentAmount": {
            "type": "number"
          },
          "targetAmount": {
            "type": "number"
          },
          "startDate": {
            "type": "string"
          },
          "targetDate": {
            "type": "string"
          },
          "category": {
            "type": "string"
          }
        },
        "required": [
          "id",
          "name",
          "currentAmount",
          "targetAmount",
          "startDate",
          "category"
        ]
      }
    }
  },
  "required": [
    "bankAccounts",
    "receipts",
    "savingsProfiles"
  ]
}
```

All dates are ISO strings.
The transaction category can be one of the following: salary, freelance, investments, gifts, refunds, initial_deposit, other, food, groceries, transport, housing, utilities, healthcare, entertainment, education, shopping, travel

Only output the JMESPath the get the result the user wants. Do not output any other text or explanations.
'''

app = FastAPI()

class QueryRequest(BaseModel):
    query: str

@app.post("/query")
def query(query: QueryRequest):
    payload = {
      "model": "openai/gpt-4o-mini",
      "messages": [
        {
          "role": "system",
          "content": instruction
        },
        {
          "role": "user",
          "content": query.query
        }
      ]
    }

    response = requests.post('https://litellm.sph-prod.ethz.ch/chat/completions', headers={
      "Content-Type": "application/json",
      "Authorization": f"Bearer {API_TOKEN}"
    }, json=payload)

    response.raise_for_status()

    result = response.json()
    choices = result['choices']

    if not choices or len(choices) == 0:
        raise Exception('invalid LLM response')
    
    path: str = choices[0]['message']['content']

    if not path:
        raise Exception('invalid LLM response')
    
    path = path.strip(' `\r\n')

    with open('../backend/db/db.json', 'rt') as f:
        return { 'result': jmespath.search(path, json.load(f)) }



uvicorn.run(app, host="127.0.0.1", port=8000)