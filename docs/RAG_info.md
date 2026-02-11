# RAG_info: FounderFlow Production-Grade RAG System

## 1. RAG Architecture Overview
FounderFlow's RAG system is a **production-grade synthetic long-term memory** architecture that provides AI agents with deep, contextual recall beyond standard LLM context windows.

### Flow:
1.  **Ingestion**: Documents/memories are sanitized and chunked (800 chars, 80 overlap)
2.  **Classification**: Gemini auto-classifies chunks into memory types
3.  **Deduplication**: SHA-256 hash check prevents duplicate embeddings
4.  **Embedding**: Chunks converted to 768-dim vectors (Gemini `text-embedding-004`)
5.  **Storage**: Vectors stored in Supabase (PostgreSQL + pgvector) with metadata
6.  **Retrieval**: Hybrid search (vector + keyword) with similarity thresholding
7.  **Ranking**: Multi-factor scoring (similarity × founder_weight × temporal_decay)
8.  **Compression**: Top chunks summarized by Gemini for token efficiency
9.  **Injection**: Compressed context injected into LLM with `<context>` tags
10. **Generation**: Gemini generates grounded response with confidence gating

## 2. Embedding Model
- **Provider**: Google Generative AI (Gemini)
- **Model**: `text-embedding-004`
- **Dimension**: 768
- **Task Type**: `RETRIEVAL_DOCUMENT` for storage, `RETRIEVAL_QUERY` for search

## 3. Chunking Strategy
- **Strategy**: Recursive Character Splitting
- **Chunk Size**: 800 characters (~200 tokens)
- **Overlap**: 80 characters (~20 tokens)
- **Rationale**: Optimized to reduce multi-topic contamination while preserving context

## 4. Vector DB Configuration
- **Platform**: Supabase (PostgreSQL + pgvector)
- **Table**: `project_memory`
- **Index**: IVFFLAT with Cosine Distance (`vector_cosine_ops`)
- **FTS Index**: GIN index on `fts` column for keyword search
- **Isolation**: Hard `project_id` filter + RLS policies

## 5. Retrieval Flow (Production-Grade)
1.  User query → Generate embedding
2.  Execute `match_documents` RPC with:
    - Vector similarity search
    - Keyword FTS search
    - Hard project_id filter
    - Similarity threshold (0.65)
    - Optional memory type filter
3.  Calculate hybrid score: `(vector × 0.7) + (keyword × 0.3)`
4.  Apply founder weighting (1.0 or 1.5)
5.  Apply temporal decay: `exp(-days_old / 90)`
6.  Filter results below threshold
7.  Calculate confidence score
8.  If confidence < 0.5 → reject context
9.  Compress top chunks via Gemini summarization
10. Return formatted context

## 6. Ranking Formula
```
FINAL_SCORE = 
  [
    (VECTOR_SIMILARITY × 0.7) + 
    (KEYWORD_SCORE × 0.3)
  ] 
  × FOUNDER_WEIGHT 
  × exp(-days_old / 90)
```

**Confidence Calculation**:
```
CONFIDENCE = (top_score × 0.7) + (avg_score × 0.3)
```

## 7. Memory Types
- `decision` — Strategic decisions
- `metric` — Performance data
- `investor_feedback` — Investor interactions
- `task` — Action items
- `research` — Market research
- `note` — General notes

Auto-classified during ingestion via Gemini.

## 8. Safety Features
- **Prompt Injection Sanitization**: Strips malicious patterns before embedding
- **Similarity Thresholding**: Mandatory 0.65 minimum (configurable)
- **Confidence Gating**: Rejects low-confidence retrievals (< 0.5)
- **Empty Context Handler**: Controlled fallback when no results found
- **Hard Isolation**: Explicit SQL `WHERE project_id = ?` filter
- **Deduplication**: SHA-256 hash prevents duplicate API calls

## 9. Performance Optimizations
- **Embedding Cache**: Reuses embeddings for identical content (SHA-256)
- **Batch Processing**: Configurable batch size (default: 5)
- **Context Compression**: Summarizes chunks to reduce token usage
- **Indexed Searches**: IVFFLAT (vector) + GIN (FTS) for sub-100ms queries

## 10. How to Re-index Documents
```bash
npx ts-node scripts/index-rag.ts
```

This will:
1. Fetch all startups from Firestore
2. Retrieve memories for each startup
3. Sanitize, chunk, classify, and embed
4. Store in Supabase with deduplication

## 11. Debugging Steps
1. **No Results**: Check similarity threshold (lower if needed)
2. **Low Confidence**: Inspect retrieved chunks in logs
3. **Wrong Context**: Verify memory_type classification
4. **Slow Queries**: Check IVFFLAT index exists
5. **Embedding Errors**: Verify `GEMINI_API_KEY` is set

## 12. Common Failure Scenarios
- **Rate Limit (429)**: Reduce batch size or add delays
- **Dimension Mismatch**: Ensure all embeddings are 768-dim
- **Empty Context**: Check if memories exist for project_id
- **Low Similarity**: Content may not be semantically related

## 13. Configuration
All parameters tunable via environment variables:

```env
RAG_MIN_SIMILARITY=0.65
RAG_MIN_CONFIDENCE=0.5
RAG_DEFAULT_LIMIT=8
RAG_CHUNK_SIZE=800
RAG_CHUNK_OVERLAP=80
RAG_VECTOR_WEIGHT=0.7
RAG_KEYWORD_WEIGHT=0.3
RAG_AGE_DECAY_DAYS=90
RAG_ENABLE_COMPRESSION=true
RAG_BATCH_SIZE=5
```

See `src/lib/rag/config.ts` for full documentation.

## 14. Observability
Every query logs:
- Query text
- Project ID
- Retrieved chunk IDs
- Similarity scores
- Final scores
- Memory types
- Confidence score

**Example**:
```
[RAG] Query: "investor feedback on pricing" (Project: abc123)
[RAG] Retrieved chunks: [
  { id: "uuid1", score: 0.82, type: "investor_feedback" },
  { id: "uuid2", score: 0.71, type: "decision" }
]
[RAG] Confidence Score: 0.78
```

## 15. Future Improvements
- **GraphRAG**: Connect entities (Founders, Investors, Tasks) in knowledge graph
- **Causal Chains**: Track memory supersession relationships
- **Multi-modal**: Support image/PDF extraction
- **Real-time Updates**: Incremental indexing on memory creation
- **A/B Testing**: Experiment with ranking weights
