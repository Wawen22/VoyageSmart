'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Clock, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ArticleListItem, CATEGORY_METADATA } from '@/types/article';

interface RelatedArticlesProps {
  currentArticleId: string;
  category: string;
  limit?: number;
}

export default function RelatedArticles({ 
  currentArticleId, 
  category, 
  limit = 3 
}: RelatedArticlesProps) {
  const [articles, setArticles] = useState<ArticleListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRelated = async () => {
      try {
        const response = await fetch(
          `/api/hub/articles?category=${category}&limit=${limit + 1}&status=published`
        );
        if (response.ok) {
          const data = await response.json();
          // Filter out current article and limit results
          const filtered = data.articles
            .filter((article: ArticleListItem) => article.id !== currentArticleId)
            .slice(0, limit);
          setArticles(filtered);
        }
      } catch (error) {
        console.error('Error fetching related articles:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRelated();
  }, [currentArticleId, category, limit]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-muted h-32 rounded-xl" />
          </div>
        ))}
      </div>
    );
  }

  if (articles.length === 0) {
    return null;
  }

  return (
    <section className="py-16 bg-gradient-to-b from-muted/30 to-background">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold">Related Articles</h2>
          <Link
            href={`/hub?category=${category}`}
            className="text-primary hover:text-primary/80 font-medium flex items-center gap-2 transition-colors group"
          >
            View All
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {articles.map((article) => {
            const categoryMeta = CATEGORY_METADATA[article.category];
            return (
              <Link
                key={article.id}
                href={`/hub/${article.slug}`}
                className="group block"
              >
                <div className="bg-gradient-to-br from-background/80 via-background/60 to-background/40 backdrop-blur-xl border-2 border-border/30 hover:border-primary/40 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 h-full">
                  {/* Image */}
                  {article.featured_image_url && (
                    <div className="relative w-full h-48 overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent z-10" />
                      <Image
                        src={article.featured_image_url}
                        alt={article.title}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                      <div className="absolute top-4 left-4 z-20">
                        <Badge
                          className="backdrop-blur-md border-white/20 shadow-lg"
                          style={{
                            backgroundColor: `${categoryMeta.color}20`,
                            borderColor: `${categoryMeta.color}40`,
                            color: categoryMeta.color
                          }}
                        >
                          {categoryMeta.name}
                        </Badge>
                      </div>
                    </div>
                  )}

                  {/* Content */}
                  <div className="p-6 space-y-3">
                    <h3 className="font-bold text-lg leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                      {article.title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {article.excerpt}
                    </p>
                    {article.read_time_minutes && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>{article.read_time_minutes} min read</span>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

