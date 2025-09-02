// Query optimization utilities and monitoring
import { db } from "./db";
import { sql } from "drizzle-orm";

export interface QueryPerformanceMetrics {
  query: string;
  executionTime: number;
  rowsReturned: number;
  planCost?: number;
}

export class QueryOptimizer {
  private static readonly SLOW_QUERY_THRESHOLD = 1000; // 1 second
  private static metrics: QueryPerformanceMetrics[] = [];

  /**
   * Execute a query with performance monitoring
   */
  static async executeWithMonitoring<T>(
    queryFn: () => Promise<T>,
    queryName: string
  ): Promise<T> {
    const startTime = performance.now();
    
    try {
      const result = await queryFn();
      const executionTime = performance.now() - startTime;
      
      // Log slow queries for analysis
      if (executionTime > this.SLOW_QUERY_THRESHOLD) {
        console.warn(`Slow query detected: ${queryName} took ${executionTime}ms`);
      }
      
      // Store metrics for analysis
      const metrics: QueryPerformanceMetrics = {
        query: queryName,
        executionTime,
        rowsReturned: Array.isArray(result) ? result.length : 1,
      };
      
      this.metrics.push(metrics);
      
      // Keep only the last 1000 metrics to prevent memory leaks
      if (this.metrics.length > 1000) {
        this.metrics = this.metrics.slice(-1000);
      }
      
      return result;
    } catch (error) {
      const executionTime = performance.now() - startTime;
      console.error(`Query failed: ${queryName} after ${executionTime}ms`, error);
      throw error;
    }
  }

  /**
   * Get performance metrics for analysis
   */
  static getMetrics(): QueryPerformanceMetrics[] {
    return [...this.metrics];
  }

  /**
   * Get slow queries report
   */
  static getSlowQueries(): QueryPerformanceMetrics[] {
    return this.metrics.filter(m => m.executionTime > this.SLOW_QUERY_THRESHOLD);
  }

  /**
   * Clear metrics history
   */
  static clearMetrics(): void {
    this.metrics = [];
  }

  /**
   * Analyze database query performance using EXPLAIN
   */
  static async explainQuery(query: string): Promise<any[]> {
    try {
      const result = await db.execute(sql.raw(`EXPLAIN (ANALYZE, BUFFERS) ${query}`));
      return result.rows;
    } catch (error) {
      console.error('Failed to explain query:', error);
      return [];
    }
  }

  /**
   * Check for missing indexes on frequently queried columns
   */
  static async analyzeMissingIndexes(): Promise<any[]> {
    try {
      const query = `
        SELECT 
          schemaname,
          tablename,
          attname as column_name,
          n_distinct,
          correlation,
          most_common_vals,
          most_common_freqs
        FROM pg_stats 
        WHERE schemaname = 'public'
        AND (n_distinct > 100 OR correlation < 0.1)
        ORDER BY tablename, attname;
      `;
      
      const result = await db.execute(sql.raw(query));
      return result.rows;
    } catch (error) {
      console.error('Failed to analyze indexes:', error);
      return [];
    }
  }

  /**
   * Get table sizes and bloat information
   */
  static async getTableStats(): Promise<any[]> {
    try {
      const query = `
        SELECT 
          schemaname,
          tablename,
          pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
          pg_stat_get_tuples_returned(c.oid) as tuples_read,
          pg_stat_get_tuples_fetched(c.oid) as tuples_fetched,
          pg_stat_get_tuples_inserted(c.oid) as tuples_inserted,
          pg_stat_get_tuples_updated(c.oid) as tuples_updated,
          pg_stat_get_tuples_deleted(c.oid) as tuples_deleted
        FROM pg_tables pt
        JOIN pg_class c ON c.relname = pt.tablename
        WHERE schemaname = 'public'
        ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
      `;
      
      const result = await db.execute(sql.raw(query));
      return result.rows;
    } catch (error) {
      console.error('Failed to get table stats:', error);
      return [];
    }
  }

  /**
   * Check for unused indexes
   */
  static async getUnusedIndexes(): Promise<any[]> {
    try {
      const query = `
        SELECT 
          indexrelname as index_name,
          relname as table_name,
          pg_size_pretty(pg_relation_size(indexrelid)) as index_size,
          idx_tup_read,
          idx_tup_fetch
        FROM pg_stat_user_indexes 
        WHERE idx_tup_read = 0 AND idx_tup_fetch = 0
        ORDER BY pg_relation_size(indexrelid) DESC;
      `;
      
      const result = await db.execute(sql.raw(query));
      return result.rows;
    } catch (error) {
      console.error('Failed to get unused indexes:', error);
      return [];
    }
  }
}

/**
 * Connection pool optimization settings
 */
export const optimizeConnectionPool = () => {
  // These settings should be applied when creating the database connection
  return {
    // Connection pool settings
    max: parseInt(process.env.DB_POOL_MAX || '20', 10),
    min: parseInt(process.env.DB_POOL_MIN || '5', 10),
    idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000', 10),
    connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '5000', 10),
    
    // Statement timeout to prevent long-running queries
    statement_timeout: '30s',
    
    // Enable query planning optimizations
    enable_seqscan: 'on',
    enable_indexscan: 'on',
    enable_bitmapscan: 'on',
    enable_hashjoin: 'on',
    enable_mergejoin: 'on',
    enable_nestloop: 'on',
    
    // Memory settings for query processing
    work_mem: '32MB',
    maintenance_work_mem: '256MB',
    
    // Enable query statistics collection
    track_activities: 'on',
    track_counts: 'on',
    track_io_timing: 'on',
    track_functions: 'pl',
  };
};