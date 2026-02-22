/*
 * WormGPT - Context Management Service
 * Handle conversations longer than model context limits
 * Implements sliding window, summarization, and memory compression
 */

class ContextManager {
    constructor (options = {}) {
        this.maxContextLength = options.maxContextLength || 30000; // Reserve 2K tokens for response
        this.maxMessages = options.maxMessages || 50;
        this.summarizationThreshold = options.summarizationThreshold || 0.8;
    }

    /**
     * Estimate token count from text (rough approximation)
     * English: ~4 characters per token
     */
    estimateTokens (text) {
        if ( ! text ) return 0;
        return Math.ceil(text.length / 4);
    }

    /**
     * Process and truncate conversation history to fit context window
     */
    processMessages (messages, options = {}) {
        const maxTokens = options.maxTokens || this.maxContextLength;
        const systemMessage = messages.find(m => m.role === 'system');
        const userMessages = messages.filter(m => m.role !== 'system');

        // Start with system message if present
        let processed = systemMessage ? [systemMessage] : [];
        let currentTokens = systemMessage ? this.estimateTokens(systemMessage.content) : 0;

        // Add messages from newest to oldest (sliding window)
        const recentMessages = userMessages.slice(-this.maxMessages);

        for ( let i = recentMessages.length - 1; i >= 0; i-- ) {
            const message = recentMessages[i];
            const messageTokens = this.estimateTokens(
                typeof message.content === 'string'
                    ? message.content
                    : JSON.stringify(message.content),
            );

            // Check if adding this message would exceed limit
            if ( currentTokens + messageTokens > maxTokens ) {
                // Try to truncate the message instead of dropping it
                const truncated = this.truncateMessage(message, maxTokens - currentTokens - 100);
                if ( truncated ) {
                    processed.unshift(truncated);
                }
                break;
            }

            processed.unshift(message);
            currentTokens += messageTokens;
        }

        return {
            messages: processed,
            tokensUsed: currentTokens,
            tokensRemaining: maxTokens - currentTokens,
            wasTruncated: userMessages.length > processed.length,
            originalCount: userMessages.length,
            processedCount: processed.filter(m => m.role !== 'system').length,
        };
    }

    /**
     * Truncate a message to fit remaining tokens
     */
    truncateMessage (message, maxTokens) {
        const content = typeof message.content === 'string'
            ? message.content
            : JSON.stringify(message.content);

        if ( this.estimateTokens(content) <= maxTokens ) {
            return message;
        }

        // Calculate how much to keep
        const maxChars = maxTokens * 4;
        const keepStart = Math.floor(maxChars * 0.3);
        const keepEnd = Math.floor(maxChars * 0.7);

        const truncated = `${content.slice(0, keepStart)
        }\n\n[...truncated...]\n\n${
            content.slice(-keepEnd)}`;

        return {
            ...message,
            content: truncated,
            _truncated: true,
        };
    }

    /**
     * Summarize old messages to preserve context while saving tokens
     * This would typically call an AI model to generate summaries
     */
    async summarizeContext (messages, aiService) {
        if ( ! aiService ) {
            // Fallback: just keep recent messages
            return this.processMessages(messages);
        }

        const systemMessage = messages.find(m => m.role === 'system');
        const recentMessages = messages.slice(-10); // Keep last 10 messages verbatim
        const oldMessages = messages.filter((m, i) =>
            i < messages.length - 10 && m.role !== 'system');

        let summary = '';

        if ( oldMessages.length > 0 ) {
            try {
                // Generate summary of old conversation
                const summaryRequest = `Summarize the following conversation in 2-3 sentences, capturing key points and decisions:\n\n${oldMessages.map(m => `${m.role}: ${m.content}`).join('\n')}`;

                const summaryResponse = await aiService.complete({
                    messages: [{ role: 'user', content: summaryRequest }],
                    model: 'qwen/qwen-3-4b:free',
                    max_tokens: 200,
                });

                summary = summaryResponse?.message?.content || '';
            } catch ( err ) {
                console.error('Context summarization failed:', err);
            }
        }

        // Build final message list with summary
        const processed = [];

        if ( systemMessage ) {
            processed.push(systemMessage);
        }

        if ( summary ) {
            processed.push({
                role: 'system',
                content: `Previous conversation summary: ${summary}`,
            });
        }

        processed.push(...recentMessages);

        return {
            messages: processed,
            tokensUsed: processed.reduce((sum, m) => sum + this.estimateTokens(m.content), 0),
            wasTruncated: false,
            hasSummary: !!summary,
            originalCount: messages.length,
            processedCount: processed.length,
        };
    }

    /**
     * Split long message into chunks for processing
     */
    chunkMessage (content, maxChunkSize = 10000) {
        if ( !content || content.length <= maxChunkSize ) {
            return [content];
        }

        const chunks = [];
        let remaining = content;

        while ( remaining.length > 0 ) {
            let chunk = remaining.slice(0, maxChunkSize);

            // Try to break at sentence boundary
            if ( remaining.length > maxChunkSize ) {
                const lastPeriod = chunk.lastIndexOf('.');
                if ( lastPeriod > maxChunkSize * 0.5 ) {
                    chunk = chunk.slice(0, lastPeriod + 1);
                }
            }

            chunks.push(chunk);
            remaining = remaining.slice(chunk.length);
        }

        return chunks;
    }

    /**
     * Process document/text for RAG-style queries
     */
    async processDocument (text, query, aiService) {
        const chunks = this.chunkMessage(text, 8000); // Smaller chunks for processing

        if ( chunks.length === 1 ) {
            // Document fits in context
            return {
                messages: [
                    { role: 'user', content: `Context:\n${text}\n\nQuestion: ${query}` },
                ],
            };
        }

        // Multi-stage processing for large documents
        // Stage 1: Find relevant chunks
        const relevancePromises = chunks.map(async (chunk, i) => {
            try {
                const response = await aiService.complete({
                    messages: [{
                        role: 'user',
                        content: `Rate relevance (0-10) of this text to the query: "${query}"\n\nText: ${chunk.slice(0, 500)}...`,
                    }],
                    model: 'qwen/qwen-3-4b:free',
                    max_tokens: 10,
                });

                const score = parseInt(response?.message?.content) || 0;
                return { index: i, score, chunk };
            } catch {
                return { index: i, score: 0, chunk };
            }
        });

        const results = await Promise.all(relevancePromises);
        const topChunks = results
            .sort((a, b) => b.score - a.score)
            .slice(0, 5) // Top 5 most relevant chunks
            .map(r => r.chunk);

        return {
            messages: [
                {
                    role: 'user',
                    content: `From the following document excerpts, answer: ${query}\n\n${topChunks.join('\n\n---\n\n')}`,
                },
            ],
            chunksUsed: topChunks.length,
            totalChunks: chunks.length,
        };
    }

    /**
     * Get context management statistics
     */
    getStats () {
        return {
            maxContextLength: this.maxContextLength,
            maxMessages: this.maxMessages,
            estimatedTokensPerMessage: 100,
        };
    }
}

module.exports = ContextManager;
