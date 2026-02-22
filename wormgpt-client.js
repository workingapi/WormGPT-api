/**
 * WormGPT Qwen 3 API Client
 * Easy integration for your WormGPT website
 *
 * Usage:
 * const wormgpt = new WormGPTClient('https://your-railway-domain.railway.app');
 * const response = await wormgpt.chat('Hello!');
 */

class WormGPTClient {
    constructor (baseUrl, options = {}) {
        this.baseUrl = baseUrl;
        this.defaultModel = options.model || 'qwen/qwen3-4b:free';
        this.timeout = options.timeout || 60000;
    }

    /**
     * Send a chat message to Qwen 3 AI
     * @param {string} message - The message to send
     * @param {object} options - Additional options
     * @param {string} options.model - Model to use (default: qwen/qwen3-4b:free)
     * @param {boolean} options.stream - Enable streaming (default: false)
     * @param {string} options.image - Image URL for vision models
     * @returns {Promise<object>} AI response
     */
    async chat (message, options = {}) {
        const response = await fetch(`${this.baseUrl}/qwen/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message,
                model: options.model || this.defaultModel,
                stream: options.stream || false,
                image: options.image,
            }),
        });

        if ( ! response.ok ) {
            const error = await response.json();
            throw new Error(error.error || 'Request failed');
        }

        return await response.json();
    }

    /**
     * Get available Qwen models
     * @returns {Promise<Array>} List of available models
     */
    async getModels () {
        const response = await fetch(`${this.baseUrl}/qwen/models`);
        if ( ! response.ok ) {
            throw new Error('Failed to fetch models');
        }
        const data = await response.json();
        return data.models || [];
    }

    /**
     * Generate code with Qwen Coder
     * @param {string} prompt - Code generation prompt
     * @param {string} language - Programming language
     * @returns {Promise<object>} Generated code
     */
    async generateCode (prompt, language = 'javascript') {
        return await this.chat(
            `Write ${language} code: ${prompt}`,
            { model: 'qwen/qwen3-coder-next' },
        );
    }

    /**
     * Analyze an image with Qwen Vision
     * @param {string} imageUrl - URL of the image to analyze
     * @param {string} question - Question about the image
     * @returns {Promise<object>} Image analysis
     */
    async analyzeImage (imageUrl, question = 'What is in this image?') {
        return await this.chat(question, {
            model: 'qwen/qwen3-vl-8b-instruct',
            image: imageUrl,
        });
    }

    /**
     * Stream a chat response
     * @param {string} message - The message to send
     * @param {object} options - Additional options
     * @returns {AsyncGenerator} Stream of response chunks
     */
    async *streamChat (message, options = {}) {
        const response = await fetch(`${this.baseUrl}/qwen/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message,
                model: options.model || this.defaultModel,
                stream: true,
            }),
        });

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while ( true ) {
            const { done, value } = await reader.read();
            if ( done ) break;

            const chunk = decoder.decode(value);
            yield chunk;
        }
    }
}

// Export for different environments
/* global module */
if ( typeof module !== 'undefined' && module.exports ) {
    module.exports = WormGPTClient;
} else if ( typeof window !== 'undefined' ) {
    window.WormGPTClient = WormGPTClient;
}
