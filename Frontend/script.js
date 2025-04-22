// script.js
document.addEventListener("DOMContentLoaded", function () {
  const uploadBox = document.getElementById("uploadBox");
  const uploadInput = document.getElementById("uploadInput");
  const processBtn = document.getElementById("processBtn");
  const resultsSection = document.getElementById("resultsSection");
  const imagePreview = document.getElementById("imagePreview");
  const textOutput = document.getElementById("textOutput");
  const newImageBtn = document.getElementById("newImageBtn");
  const loader = document.getElementById("loader");

  // Update API URL to point to the correct port (Flask backend)
  const API_URL = "http://127.0.0.1:5000/api/extract-text";

  let selectedFile = null;

  // Handle drag and drop
  uploadBox.addEventListener("dragover", (e) => {
    e.preventDefault();
    uploadBox.classList.add("active");
  });

  uploadBox.addEventListener("dragleave", () => {
    uploadBox.classList.remove("active");
  });

  uploadBox.addEventListener("drop", (e) => {
    e.preventDefault();
    uploadBox.classList.remove("active");

    if (e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  });

  // Handle click to upload
  uploadBox.addEventListener("click", () => {
    uploadInput.click();
  });

  uploadInput.addEventListener("change", () => {
    if (uploadInput.files.length > 0) {
      handleFile(uploadInput.files[0]);
    }
  });

  function handleFile(file) {
    if (file.type.startsWith("image/")) {
      selectedFile = file;

      const previewText = document.createElement("p");
      previewText.textContent = `Selected: ${file.name}`;
      previewText.classList.add("selected-file-text");

      // Clear previous selection text and add new one
      Array.from(
        uploadBox.getElementsByClassName("selected-file-text")
      ).forEach((p) => {
        p.remove();
      });
      uploadBox.appendChild(previewText);

      processBtn.disabled = false;
    } else {
      alert("Please select a valid image file.");
    }
  }

  processBtn.addEventListener("click", processImage);
  newImageBtn.addEventListener("click", resetUI);

  function processImage() {
    if (!selectedFile) return;

    // Show loader and hide upload section
    loader.style.display = "block";
    uploadBox.style.display = "none";
    processBtn.disabled = true;

    // Clear previous results
    imagePreview.innerHTML = "";
    textOutput.textContent = "Processing...";

    // Create form data
    const formData = new FormData();
    formData.append("image", selectedFile);

    // Send request to API
    fetch(API_URL, {
      method: "POST",
      body: formData,
    })
      .then((response) => {
        if (!response.ok) {
          // Try to get error details from response
          return response.text().then((text) => {
            let errorMsg = "Network response was not ok";
            try {
              const errorData = JSON.parse(text);
              errorMsg = errorData.error || errorMsg;
            } catch (e) {
              errorMsg = text || errorMsg;
            }
            throw new Error(errorMsg);
          });
        }
        return response.json();
      })
      .then((data) => {
        // Make sure image URLs use the correct port
        data.originalImage = "http://127.0.0.1:5000" + data.originalImage;
        data.enhancedImage = "http://127.0.0.1:5000" + data.enhancedImage;

        // Display results
        displayResults(data);
      })
      .catch((error) => {
        console.error("Error:", error);
        textOutput.textContent = "Error processing image: " + error.message;
        loader.style.display = "none";
        resultsSection.style.display = "flex";
      });
  }

  function displayResults(data) {
    // Create original image container
    const originalContainer = document.createElement("div");
    originalContainer.className = "image-card";
    originalContainer.innerHTML = `
            <h4>Original</h4>
            <img src="${data.originalImage}" alt="Original Image">
        `;

    // Create enhanced image container
    const enhancedContainer = document.createElement("div");
    enhancedContainer.className = "image-card";
    enhancedContainer.innerHTML = `
            <h4>Enhanced</h4>
            <img src="${data.enhancedImage}" alt="Enhanced Image">
        `;

    // Add images to preview
    imagePreview.appendChild(originalContainer);
    imagePreview.appendChild(enhancedContainer);

    // Display extracted text
    textOutput.textContent = data.text || "No text detected in image.";

    // Hide loader and show results
    loader.style.display = "none";
    resultsSection.style.display = "flex";
  }

  function resetUI() {
    selectedFile = null;
    uploadInput.value = "";

    // Reset upload box text
    const selectedText = uploadBox.getElementsByClassName("selected-file-text");
    Array.from(selectedText).forEach((el) => el.remove());

    // Show upload section and hide results
    uploadBox.style.display = "flex";
    resultsSection.style.display = "none";
    processBtn.disabled = true;
  }
});
