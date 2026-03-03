/*-------------------------------------------------------------------------
 *
 * cache_test.go
 *    Tests for cache package
 *
 * Copyright (c) 2024-2026, neurondb, Inc. <support@neurondb.ai>
 *
 * IDENTIFICATION
 *    NeuronMCP/internal/cache/cache_test.go
 *
 *-------------------------------------------------------------------------
 */

package cache

import (
	"context"
	"testing"
	"time"

	"github.com/neurondb/NeuronMCP/pkg/mcp"
)

func TestNewMemoryCache(t *testing.T) {
	c := NewMemoryCache()
	if c == nil {
		t.Fatal("NewMemoryCache() returned nil")
	}
}

func TestMemoryCacheGetSetDelete(t *testing.T) {
	ctx := context.Background()
	c := NewMemoryCache()
	defer c.Clear(ctx)

	err := c.Set(ctx, "k1", "v1", time.Minute)
	if err != nil {
		t.Fatalf("Set: %v", err)
	}
	val, ok := c.Get(ctx, "k1")
	if !ok {
		t.Fatal("Get: expected hit")
	}
	if val != "v1" {
		t.Errorf("Get: expected v1, got %v", val)
	}

	_, ok = c.Get(ctx, "missing")
	if ok {
		t.Error("Get: expected miss for missing key")
	}

	err = c.Delete(ctx, "k1")
	if err != nil {
		t.Fatalf("Delete: %v", err)
	}
	_, ok = c.Get(ctx, "k1")
	if ok {
		t.Error("Get after Delete: expected miss")
	}
}

func TestMemoryCacheClear(t *testing.T) {
	ctx := context.Background()
	c := NewMemoryCache()
	_ = c.Set(ctx, "a", 1, time.Minute)
	_ = c.Set(ctx, "b", 2, time.Minute)
	err := c.Clear(ctx)
	if err != nil {
		t.Fatalf("Clear: %v", err)
	}
	_, ok := c.Get(ctx, "a")
	if ok {
		t.Error("expected miss after Clear")
	}
}

func TestCacheEntryIsExpired(t *testing.T) {
	entry := &CacheEntry{Value: "x", ExpiresAt: time.Now().Add(-time.Second)}
	if !entry.IsExpired() {
		t.Error("entry in the past should be expired")
	}
	entry.ExpiresAt = time.Now().Add(time.Hour)
	if entry.IsExpired() {
		t.Error("entry in the future should not be expired")
	}
}

func TestGenerateCacheKey(t *testing.T) {
	key := GenerateCacheKey("prefix", map[string]interface{}{"a": 1, "b": "x"})
	if key == "" {
		t.Fatal("GenerateCacheKey returned empty")
	}
	if len(key) < 10 {
		t.Errorf("key too short: %s", key)
	}
	key2 := GenerateCacheKey("prefix", map[string]interface{}{"a": 1, "b": "x"})
	if key != key2 {
		t.Error("same params should produce same key")
	}
	key3 := GenerateCacheKey("prefix", map[string]interface{}{"a": 2})
	if key == key3 {
		t.Error("different params should produce different key")
	}
}

func TestNewIdempotencyCache(t *testing.T) {
	c := NewIdempotencyCache(time.Minute)
	if c == nil {
		t.Fatal("NewIdempotencyCache returned nil")
	}
	defer c.Close()
}

func TestIdempotencyCache_GetSetDeleteClearSize(t *testing.T) {
	c := NewIdempotencyCacheWithSize(time.Minute, 10)
	defer c.Close()

	result := &mcp.ToolResult{Content: []mcp.ContentBlock{{Type: "text", Text: "ok"}}}
	c.Set("key1", result)
	got, ok := c.Get("key1")
	if !ok {
		t.Fatal("Get: expected hit")
	}
	if got != result {
		t.Error("Get: wrong result")
	}
	if c.Size() != 1 {
		t.Errorf("Size: got %d", c.Size())
	}

	c.Set("", result)
	if c.Size() != 1 {
		t.Error("Set with empty key should no-op")
	}

	_, ok = c.Get("")
	if ok {
		t.Error("Get with empty key should miss")
	}

	c.Delete("key1")
	_, ok = c.Get("key1")
	if ok {
		t.Error("expected miss after Delete")
	}

	c.Set("a", result)
	c.Set("b", result)
	c.Clear()
	if c.Size() != 0 {
		t.Errorf("Clear: size %d", c.Size())
	}
}

func TestIdempotencyCache_EvictLRU(t *testing.T) {
	c := NewIdempotencyCacheWithSize(time.Minute, 2)
	defer c.Close()
	result := &mcp.ToolResult{}
	c.Set("k1", result)
	c.Set("k2", result)
	c.Get("k1")
	c.Set("k3", result)
	if c.Size() > 2 {
		t.Errorf("expected at most 2 entries, got %d", c.Size())
	}
}

func TestNewQueryCache(t *testing.T) {
	qc := NewQueryCache(time.Minute, 100)
	if qc == nil {
		t.Fatal("NewQueryCache returned nil")
	}
}

func TestQueryCache_GetSet(t *testing.T) {
	ctx := context.Background()
	qc := NewQueryCache(time.Minute, 10)
	qc.Set(ctx, "SELECT 1", nil, "result", 0)
	val, ok := qc.Get(ctx, "SELECT 1", nil)
	if !ok {
		t.Fatal("Get: expected hit")
	}
	if val != "result" {
		t.Errorf("Get: got %v", val)
	}
	_, ok = qc.Get(ctx, "SELECT 2", nil)
	if ok {
		t.Error("expected miss")
	}
}

func TestQueryCache_Invalidate(t *testing.T) {
	ctx := context.Background()
	qc := NewQueryCache(time.Minute, 10)
	qc.Set(ctx, "q1", nil, "r1", 0)
	qc.Invalidate(ctx, "")
	if qc.GetStats()["size"].(int) != 0 {
		t.Error("Invalidate with empty pattern should clear all")
	}
}

func TestQueryCache_InvalidateByTable(t *testing.T) {
	ctx := context.Background()
	qc := NewQueryCache(time.Minute, 10)
	qc.Set(ctx, "q1", nil, map[string]interface{}{"table": "t1"}, 0)
	qc.InvalidateByTable(ctx, "t1")
	if qc.GetStats()["size"].(int) != 0 {
		t.Error("InvalidateByTable should remove matching entry")
	}
}

func TestQueryCache_InvalidateBySchema(t *testing.T) {
	ctx := context.Background()
	qc := NewQueryCache(time.Minute, 10)
	qc.Set(ctx, "q1", nil, map[string]interface{}{"schema": "s1"}, 0)
	qc.InvalidateBySchema(ctx, "s1")
	if qc.GetStats()["size"].(int) != 0 {
		t.Error("InvalidateBySchema should remove matching entry")
	}
}

func TestQueryCache_WarmCache_GetStats(t *testing.T) {
	ctx := context.Background()
	qc := NewQueryCache(time.Minute, 10)
	err := qc.WarmCache(ctx, []WarmQuery{{Query: "SELECT 1", Params: nil}})
	if err != nil {
		t.Fatalf("WarmCache: %v", err)
	}
	stats := qc.GetStats()
	if stats["max_size"] != 10 {
		t.Errorf("GetStats: got %v", stats)
	}
}
