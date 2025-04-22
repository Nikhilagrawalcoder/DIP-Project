from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import easyocr
import numpy as np
import cv2
import os
from werkzeug.utils import secure_filename
import uuid

app = Flask(__name__, static_folder='frontend')
CORS(app)  # Enable CORS for all routes

# Configuration
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

# Create upload folder if it doesn't exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def enhance_image(image):
    # Convert to grayscale
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    
    # Apply adaptive thresholding
    thresh = cv2.adaptiveThreshold(
        gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
        cv2.THRESH_BINARY, 11, 2
    )
    
    # Apply noise reduction
    denoised = cv2.fastNlMeansDenoising(thresh, None, 10, 7, 21)
    
    # Apply additional contrast
    kernel = np.ones((1, 1), np.uint8)
    dilated = cv2.dilate(denoised, kernel, iterations=1)
    eroded = cv2.erode(dilated, kernel, iterations=1)
    
    return eroded

def extract_text(image):
    try:
        # Initialize EasyOCR reader
        reader = easyocr.Reader(['en'])  # You can add more languages like 'fr', 'de', etc.
        
        # Use EasyOCR to extract text from the image
        result = reader.readtext(image)
        
        # Combine all extracted text into one string
        text = " ".join([detection[1] for detection in result])
        return text
    except Exception as e:
        print(f"Error extracting text: {str(e)}")
        return "Error extracting text"

@app.route('/api/extract-text', methods=['POST'])
def process_image():
    if 'image' not in request.files:
        return jsonify({'error': 'No image provided'}), 400
    
    file = request.files['image']
    
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    if file and allowed_file(file.filename):
        # Generate unique filename
        filename = str(uuid.uuid4()) + "_" + secure_filename(file.filename)
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        file.save(filepath)
        
        try:
            # Read image
            image = cv2.imread(filepath)
            if image is None:
                return jsonify({'error': 'Could not read image'}), 400
            
            # Enhance image (optional, you can skip this if unnecessary)
            enhanced_image = enhance_image(image)
            
            # Save enhanced image
            enhanced_filename = f"enhanced_{filename}"
            enhanced_filepath = os.path.join(UPLOAD_FOLDER, enhanced_filename)
            cv2.imwrite(enhanced_filepath, enhanced_image)
            
            # Extract text using EasyOCR
            text = extract_text(enhanced_image)
            
            return jsonify({
                'text': text,
                'originalImage': f"/api/images/{filename}",
                'enhancedImage': f"/api/images/{enhanced_filename}"
            })
            
        except Exception as e:
            return jsonify({'error': str(e)}), 500
        finally:
            # Optional: Clean up if necessary
            # if os.path.exists(filepath):
            #     os.remove(filepath)
            pass
    
    return jsonify({'error': 'Invalid file type'}), 400

@app.route('/api/images/<filename>')
def get_image(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)

@app.route('/')
def serve_frontend():
    return send_from_directory('frontend', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('frontend', path)

if __name__ == '__main__':
    app.run(debug=True, use_reloader=False)
