try:
    from google import genai
    from flask import Flask, request, jsonify
    # from google.genai import types
    import json
except ImportError:
    print("Install required packages !! run this command pip install google-genai flask")

client = genai.Client(api_key="AIzaSyDlRBweyr4Rb71xRyMpVOGV0q3WHljzphg")
app = Flask(__name__)

@app.route('/classify', methods=['POST'])
def classify_image():
    if 'image' not in request.files:
        return jsonify({'error': 'No image file uploaded'}), 400
    image_file = request.files['image']
    data = image_file.read()
    response = client.models.generate_content(
    model="gemini-2.5-flash", 
    contents = [
        {
            "parts": [
                {
                    "inline_data": {
                        "mime_type": "image/jpeg",
                        "data": data
                    }
                }
            ]
        }
    ],
        # description if needed mostly no needed

    config={
        "system_instruction": """
            You are an assistant that reviews reports or images of public infrastructure issues 
            and classifies them into a category and a severity level.

            Return your response only as a JSON object with the following format:
            {"category": "<category>", "seviority": "<seviority>"}

            Valid categories:
            - 'garbage'
            - 'electric_pole'
            - 'pothole'

            Valid seviority levels:
            - 'low'
            - 'medium'
            - 'high'

            If the issue does not belong to any of the above categories, return null for both category and seviority.
            Determine the seviority based on the visible or described condition.
            Do not include any explanation or extra text.

            Example:
            If there is an overflowing garbage dump spread on the road, return:
            {"category": "garbage", "seviority": "high"}

        """
    }
)
    result = json.loads(response.text)
    if result['category'] != 'null': 
        return response.text, 200, {'Content-Type': 'application/json'}
    else:
        return jsonify({'category': None, 'seviority': None}), 200
if __name__ == '__main__':
    app.run(debug=True)