import os
import base64
from openai import OpenAI

# Load image and encode in base64
with open("example.jpeg", "rb") as f:
    image_base64 = base64.b64encode(f.read()).decode("utf-8")

client = OpenAI(
    base_url="https://api.studio.nebius.com/v1/",
    api_key="eyJhbGciOiJIUzI1NiIsImtpZCI6IlV6SXJWd1h0dnprLVRvdzlLZWstc0M1akptWXBvX1VaVkxUZlpnMDRlOFUiLCJ0eXAiOiJKV1QifQ.eyJzdWIiOiJnb29nbGUtb2F1dGgyfDExMTI2Nzk4MTAyNjY1Nzc2NDY0MSIsInNjb3BlIjoib3BlbmlkIG9mZmxpbmVfYWNjZXNzIiwiaXNzIjoiYXBpX2tleV9pc3N1ZXIiLCJhdWQiOlsiaHR0cHM6Ly9uZWJpdXMtaW5mZXJlbmNlLmV1LmF1dGgwLmNvbS9hcGkvdjIvIl0sImV4cCI6MTkxNTY4NDQ5NCwidXVpZCI6IjAxOTk1MTNiLWMyMWMtNzkyMi04MmU4LTRjZTM0NjA1MDlhMCIsIm5hbWUiOiJTSUgiLCJleHBpcmVzX2F0IjoiMjAzMC0wOS0xNVQwNjozNDo1NCswMDAwIn0.LL_q2fLC7kGiFjQO2x17vWLSsnirxh94UE_8aLfZNMc"
)

response = client.chat.completions.create(
    model="google/gemma-3-27b-it",
    messages=[
        {
            "role": "system",
            "content": "You are a helpful assistant that describes images."
        },
        {
            "role": "user",
            "content": [
                {"type": "text", "text": "What’s in this picture?"},
                {
                    "type": "image_url",
                    "image_url": {
                        "url": f"data:image/jpeg;base64,{image_base64}"
                    }
                }
            ]
        }
    ]
)

print(response.to_json())
