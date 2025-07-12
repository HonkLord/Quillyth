// Gemini AI Service for Dynamic Content Generation
export class GeminiService {
  constructor() {
    if (window.geminiServiceInstance) {
      return window.geminiServiceInstance;
    }
    this.apiKey = this.getApiKey();
    this.model = "gemini-2.5-flash-lite-preview-06-17";
    this.baseUrl = "https://generativelanguage.googleapis.com/v1beta";
    this.pendingRequests = new Map(); // Track pending requests for retry
    window.geminiServiceInstance = this;
  }

  getApiKey() {
    const storedKey = localStorage.getItem("GEMINI_API_KEY");
    return storedKey || null;
  }

  async testApiKeyConnection() {
    const url = `${this.baseUrl}/models/${this.model}:generateContent?key=${this.apiKey}`;
    const requestBody = {
      contents: [
        {
          role: "user",
          parts: [
            { text: "Test connection. Please respond with just: SUCCESS" },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 8192,
      },
    };

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API test failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    if (!data.candidates || !data.candidates[0]) {
      throw new Error("Invalid API response structure");
    }
    return true;
  }

  async generateContent(prompt, showModalOnError = true) {
    if (!this.apiKey) {
      if (showModalOnError) {
        try {
          await this.showApiKeyModal();
        } catch (error) {
          throw new Error("API key is required for AI generation");
        }
      } else {
        throw new Error("Gemini API key not configured");
      }
    }

    try {
      // Pass 1: Creative generation at high temperature
      const creativeResponse = await this.makeApiCall(prompt, {
        temperature: 0.9,
        topK: 40,
        topP: 0.95,
      });

      return creativeResponse;
    } catch (error) {
      if (this.isApiKeyError(error) && showModalOnError) {
        try {
          await this.showApiKeyModal();
          return this.generateContent(prompt, false);
        } catch (modalError) {
          throw new Error("Failed to set API key");
        }
      }
      throw error;
    }
  }

  async makeApiCall(prompt, generationConfig) {
    const url = `${this.baseUrl}/models/${this.model}:generateContent?key=${this.apiKey}`;
    const requestBody = {
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: generationConfig.temperature || 0.7,
        topK: generationConfig.topK || 40,
        topP: generationConfig.topP || 0.95,
        maxOutputTokens: 8192,
      },
    };

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  }

  isApiKeyError(error) {
    return (
      error.message.includes("API key") ||
      error.message.includes("401") ||
      error.message.includes("403")
    );
  }

  showApiKeyModal() {
    return new Promise((resolve, reject) => {
      const modal = document.createElement("div");
      modal.className =
        "fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4";
      modal.innerHTML = `
        <div class="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-bold text-[#6d513d]">
              <i class="fas fa-key mr-2"></i>Gemini API Key Required
            </h3>
          </div>
          
          <div class="mb-4">
            <p class="text-sm text-[#8a6d50] mb-3">
              To generate AI content, please provide your Google Gemini API key. 
              This will be stored locally in your browser.
            </p>
            <p class="text-xs text-[#a17c5b] mb-4">
              Get your free API key at: 
              <a href="https://aistudio.google.com/app/apikey" target="_blank" class="text-blue-600 underline">
                https://aistudio.google.com/app/apikey
              </a>
            </p>
            
            <label class="block text-sm font-medium text-[#6d513d] mb-2">
              API Key:
            </label>
            <input type="password" id="gemini-api-key-input" 
                   class="w-full px-3 py-2 border border-[#d9c9b9] rounded focus:outline-none focus:ring-2 focus:ring-[#6d513d]"
                   placeholder="AIza..." />
            <div id="api-key-error" class="text-red-600 text-xs mt-1 hidden">
              Please enter a valid API key
            </div>
          </div>

          <div class="flex justify-end space-x-3">
            <button id="cancel-api-key" class="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors">
              Cancel
            </button>
            <button id="test-api-key" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
              <i class="fas fa-vial mr-1"></i>Test Key
            </button>
            <button id="save-api-key" class="px-4 py-2 bg-[#6d513d] text-white rounded hover:bg-[#5a4530] transition-colors">
              <i class="fas fa-save mr-1"></i>Save & Continue
            </button>
          </div>
        </div>
      `;

      document.body.appendChild(modal);

      const input = modal.querySelector("#gemini-api-key-input");
      const errorDiv = modal.querySelector("#api-key-error");
      const cancelBtn = modal.querySelector("#cancel-api-key");
      const testBtn = modal.querySelector("#test-api-key");
      const saveBtn = modal.querySelector("#save-api-key");

      input.focus();

      const validateKey = (key) => {
        return key && key.length > 20 && key.startsWith("AIza");
      };

      testBtn.onclick = async () => {
        const key = input.value.trim();
        if (!validateKey(key)) {
          errorDiv.textContent =
            'Please enter a valid API key (should start with "AIza")';
          errorDiv.classList.remove("hidden");
          return;
        }

        testBtn.innerHTML =
          '<i class="fas fa-spinner fa-spin mr-1"></i>Testing...';
        testBtn.disabled = true;

        try {
          const originalKey = this.apiKey;
          this.apiKey = key;
          await this.testApiKeyConnection();

          errorDiv.classList.add("hidden");
          testBtn.innerHTML = '<i class="fas fa-check mr-1"></i>Valid!';
          testBtn.className = "px-4 py-2 bg-green-600 text-white rounded";
          saveBtn.disabled = false;
        } catch (error) {
          this.apiKey = originalKey;
          errorDiv.textContent = `Test failed: ${error.message}`;
          errorDiv.classList.remove("hidden");
          testBtn.innerHTML = '<i class="fas fa-vial mr-1"></i>Test Key';
          testBtn.disabled = false;
          testBtn.className =
            "px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors";
        }
      };

      saveBtn.onclick = () => {
        const key = input.value.trim();
        if (!validateKey(key)) {
          errorDiv.textContent = "Please enter a valid API key";
          errorDiv.classList.remove("hidden");
          return;
        }

        localStorage.setItem("GEMINI_API_KEY", key);
        this.apiKey = key;
        document.body.removeChild(modal);
        resolve(key);
      };

      cancelBtn.onclick = () => {
        document.body.removeChild(modal);
        reject(new Error("User cancelled API key setup"));
      };

      input.onkeydown = (e) => {
        if (e.key === "Enter") {
          saveBtn.click();
        }
      };
    });
  }
}

// Export the class
export default GeminiService;
