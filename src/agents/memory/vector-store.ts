// Vector Store implementation using Pinecone

import { Pinecone } from '@pinecone-database/pinecone';
import { VectorStore, VectorEntry, VectorSearchResult } from './types';

export class PineconeVectorStore implements VectorStore {
  private client: Pinecone;
  private index: any;

  constructor(apiKey: string, environment: string, indexName: string) {
    this.client = new Pinecone({
      apiKey
    });
    this.index = this.client.index(indexName);
  }

  async upsert(entries: VectorEntry[]): Promise<void> {
    try {
      // For now, ignore namespaces and upsert all entries together
      const vectors = entries.map(entry => ({
        id: entry.id,
        values: entry.vector,
        metadata: entry.metadata
      }));

      await this.index.upsert(vectors);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to upsert vectors: ${error.message}`);
      }
      throw new Error('Failed to upsert vectors: Unknown error');
    }
  }

  async query(
    vector: number[], 
    topK: number, 
    namespace?: string, 
    filter?: Record<string, any>
  ): Promise<VectorSearchResult[]> {
    try {
      const queryRequest: any = {
        vector,
        topK,
        includeValues: true,
        includeMetadata: true
      };

      // For now, ignore namespaces
      // if (namespace && namespace !== 'default') {
      //   queryRequest.namespace = namespace;
      // }

      if (filter) {
        queryRequest.filter = filter;
      }

      // Use the correct Pinecone v2 API format
      const response = await this.index.query(queryRequest);

      return response.matches?.map((match: any) => ({
        id: match.id,
        score: match.score,
        vector: match.values || [],
        metadata: match.metadata || {}
      })) || [];
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to query vectors: ${error.message}`);
      }
      throw new Error('Failed to query vectors: Unknown error');
    }
  }

  async delete(ids: string[], namespace?: string): Promise<void> {
    try {
      await this.index.deleteMany({
        ids,
        namespace: namespace || undefined
      });
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to delete vectors: ${error.message}`);
      }
      throw new Error('Failed to delete vectors: Unknown error');
    }
  }

  async update(entries: VectorEntry[]): Promise<void> {
    try {
      // Group entries by namespace
      const namespaceGroups = this.groupByNamespace(entries);
      
      for (const [namespace, namespaceEntries] of Object.entries(namespaceGroups)) {
        const vectors = namespaceEntries.map(entry => ({
          id: entry.id,
          values: entry.vector,
          metadata: entry.metadata
        }));

        await this.index.update({
          vectors,
          namespace: namespace || undefined
        });
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to update vectors: ${error.message}`);
      }
      throw new Error('Failed to update vectors: Unknown error');
    }
  }

  private groupByNamespace(entries: VectorEntry[]): Record<string, VectorEntry[]> {
    const groups: Record<string, VectorEntry[]> = {};
    
    for (const entry of entries) {
      const namespace = entry.namespace || 'default';
      if (!groups[namespace]) {
        groups[namespace] = [];
      }
      groups[namespace].push(entry);
    }
    
    return groups;
  }
}
