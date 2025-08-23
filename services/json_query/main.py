import aiohttp
from fastapi import FastAPI
from pydantic import BaseModel
import jmespath
import uvicorn
import json
import os
from dotenv import load_dotenv
from jmespath.functions import Functions
import asyncio

load_dotenv()

API_TOKEN = os.getenv('LITTLE_LLM_TOKEN')

print(API_TOKEN)

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

original_sum = Functions.FUNCTION_TABLE['sum']['function']
def flat_sum_patch(self, arg):
    if len(arg) == 0:
        return 0
    
    if isinstance(arg[0], list):
        arg = [val for nested in arg for val in nested]

    return original_sum(self, arg)

Functions.FUNCTION_TABLE['sum']['signature'] = ({'types': ['array-number', 'array-array']},)
Functions.FUNCTION_TABLE['sum']['function'] = flat_sum_patch

async def run_query(payload: dict, session: aiohttp.ClientSession, db: dict):
    try:
        async with session.post('https://litellm.sph-prod.ethz.ch/chat/completions', headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {API_TOKEN}"
        }, json=payload) as resp:
            if resp.status != 200:
                return
            
            result = int(await resp.json())

        choices = result['choices']

        if not choices or len(choices) == 0:
            raise Exception('invalid LLM response')
        
        path: str = choices[0]['message']['content']

        if not path:
            raise Exception('invalid LLM response')
        
        if path.startswith('```jmespath'):
            path = path[11:]
        
        path.replace('\\n', '\n')
        path = path.strip(' `\r\n')

        return jmespath.search(path, db)
    except Exception as e:
        print(e)
        return
    
def monte_carlo(results: list):
    if len(results) == 0:
        return None

    counter = {}
    value_map = {}

    for result in results:
        if str(result) in results:
            counter[str(result)] += 1
        else:
            counter[str(result)] = 1
            value_map[str(result)] = result

    keys = list(counter.keys())
    max_key = keys[0]
    max_value = counter[max_key]

    for key in keys:
        count = counter[key]
        if count > max_value:
            max_value = count
            max_key = key

    return value_map[max_key]

@app.post("/query")
async def query(query: QueryRequest):
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

    with open('../backend/db/db.json', 'rt') as f:
        db = json.load(f)

    async with aiohttp.ClientSession() as session:
        responses = await asyncio.gather(*[run_query(payload, session, db) for _ in range(3)])

    return {'result': monte_carlo(responses), 'responses': responses}



uvicorn.run(app, host="127.0.0.1", port=9000)