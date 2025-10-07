'use client';

import { useState, useEffect } from 'react';
import { Loader2, TrendingUp } from 'lucide-react';
import HubHero from '@/components/hub/HubHero';
import ArticleCard from '@/components/hub/ArticleCard';
import CategoryFilter from '@/components/hub/CategoryFilter';
import HubSearch from '@/components/hub/HubSearch';
import { Button } from '@/components/ui/button';
import { ArticleListItem, ArticleCategory } from '@/types/article';
import Link from 'next/link';

export default function HubPage() {
  const [articles, setArticles] = useState<ArticleListItem[]>([]);
  const [featuredArticles, setFeaturedArticles] = useState<ArticleListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ArticleCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const limit = 12;

  // Fetch featured articles
  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const response = await fetch('/api/hub/featured?limit=3');
        if (response.ok) {
          const data = await response.json();
          setFeaturedArticles(data);
        }
      } catch (error) {
        console.error('Error fetching featured articles:', error);
      }
    };

    fetchFeatured();
  }, []);

  // Fetch articles
  useEffect(() => {
    const fetchArticles = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          limit: limit.toString(),
          offset: '0',
          status: 'published'
        });

        if (selectedCategory !== 'all') {
          params.append('category', selectedCategory);
        }

        if (searchQuery) {
          params.append('search', searchQuery);
        }

        const response = await fetch(`/api/hub/articles?${params}`);
        if (response.ok) {
          const data = await response.json();
          setArticles(data.articles);
          setTotal(data.total);
          setOffset(limit);
        }
      } catch (error) {
        console.error('Error fetching articles:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, [selectedCategory, searchQuery]);

  // Load more articles
  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
        status: 'published'
      });

      if (selectedCategory !== 'all') {
        params.append('category', selectedCategory);
      }

      if (searchQuery) {
        params.append('search', searchQuery);
      }

      const response = await fetch(`/api/hub/articles?${params}`);
      if (response.ok) {
        const data = await response.json();
        setArticles((prev) => [...prev, ...data.articles]);
        setOffset((prev) => prev + limit);
      }
    } catch (error) {
      console.error('Error loading more articles:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  const hasMore = articles.length < total;

  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Hero Section */}
      {featuredArticles.length > 0 && (
        <HubHero featuredArticles={featuredArticles} />
      )}

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 py-12 md:py-16 space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Travel Hub
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Discover travel guides, tips, news, and inspiration for your next adventure
          </p>
        </div>

        {/* Search */}
        <HubSearch onSearch={setSearchQuery} />

        {/* Category Filter */}
        <CategoryFilter
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
        />

        {/* Results Count */}
        {!loading && (
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground">
              {searchQuery ? (
                <>
                  Found <span className="font-semibold text-foreground">{total}</span> article{total !== 1 ? 's' : ''} for "{searchQuery}"
                </>
              ) : (
                <>
                  Showing <span className="font-semibold text-foreground">{articles.length}</span> of <span className="font-semibold text-foreground">{total}</span> article{total !== 1 ? 's' : ''}
                </>
              )}
            </p>
          </div>
        )}

        {/* Articles Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        ) : articles.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {articles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>

            {/* Load More Button */}
            {hasMore && (
              <div className="flex justify-center pt-8">
                <Button
                  onClick={loadMore}
                  disabled={loadingMore}
                  size="lg"
                  className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-white px-8 py-6 rounded-xl text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                >
                  {loadingMore ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      Load More Articles
                      <TrendingUp className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-6">
              <TrendingUp className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-2xl font-bold mb-2">No articles found</h3>
            <p className="text-muted-foreground mb-6">
              {searchQuery
                ? `No articles match your search for "${searchQuery}"`
                : 'No articles available in this category'}
            </p>
            {(searchQuery || selectedCategory !== 'all') && (
              <Button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
                variant="outline"
              >
                Clear Filters
              </Button>
            )}
          </div>
        )}
      </div>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />
        <div className="container mx-auto px-4 sm:px-6 text-center relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Plan Your Next Adventure?
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of travelers using VoyageSmart to plan, organize, and experience amazing trips
          </p>
          <Link href="/register">
            <Button
              size="lg"
              className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-white px-12 py-6 rounded-xl text-lg font-semibold shadow-2xl hover:shadow-primary/25 transition-all duration-300 hover:scale-105"
            >
              Start Planning Free
            </Button>
          </Link>
        </div>
      </section>
    </main>
  );
}

