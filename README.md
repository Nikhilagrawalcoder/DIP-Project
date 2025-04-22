
---

## 🚀 Features

- Upload an image (JPG/PNG/JPEG/GIF)
- Enhance the image using OpenCV techniques:
  - Grayscale conversion
  - Adaptive thresholding
  - Noise reduction
  - Dilation & erosion
- Extract text from the enhanced image using EasyOCR
- View original and enhanced images via URL
- Cross-origin requests enabled via Flask-CORS

---

## 🛠️ Tech Stack

### Backend:
- **Flask** – Python web framework
- **EasyOCR** – Deep learning-based OCR
- **OpenCV** – Image processing
- **NumPy** – Matrix operations
- **Werkzeug** – Secure filename handling

### Frontend:
- HTML/CSS/JavaScript (or React/Vue if you've extended it)
- Connects via API (`/api/extract-text`)

---

## ⚙️ Setup Instructions

### 🐍 Backend Setup

1. **Clone the repo**:
   ```bash
   git clone https://github.com/yourusername/ocr-app.git
   cd ocr-app
