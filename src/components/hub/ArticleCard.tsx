'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Clock, Eye, Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArticleListItem, CATEGORY_METADATA } from '@/types/article';
import { formatDistanceToNow } from 'date-fns';

interface ArticleCardProps {
  article: ArticleListItem;
  variant?: 'default' | 'featured';
}

export default function ArticleCard({ article, variant = 'default' }: ArticleCardProps) {
  const categoryMeta = CATEGORY_METADATA[article.category];
  const isFeatured = variant === 'featured' || article.is_featured;

  const formattedDate = article.published_at
    ? formatDistanceToNow(new Date(article.published_at), { addSuffix: true })
    : 'Draft';

  return (
    <Link href={`/hub/${article.slug}`} className="block group">
      <Card
        className={`
          overflow-hidden border-2 transition-all duration-500 h-full
          ${isFeatured 
            ? 'border-primary/30 hover:border-primary/60 shadow-xl hover:shadow-2xl' 
            : 'border-border/50 hover:border-primary/40 shadow-lg hover:shadow-xl'
          }
          hover:-translate-y-2 hover:scale-[1.02]
          bg-gradient-to-br from-background/80 via-background/60 to-background/40 backdrop-blur-xl
        `}
      >
        {/* Featured Image */}
        {article.featured_image_url && (
          <div className="relative w-full h-48 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent z-10" />
            <Image
              src={article.featured_image_url}
              alt={article.title}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-110"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            
            {/* Category Badge on Image */}
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

            {/* Featured Badge */}
            {article.is_featured && (
              <div className="absolute top-4 right-4 z-20">
                <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0 shadow-lg">
                  ⭐ Featured
                </Badge>
              </div>
            )}
          </div>
        )}

        <CardContent className="p-6 space-y-4">
          {/* Title */}
          <h3
            className={`
              font-bold leading-tight transition-colors duration-300
              ${isFeatured ? 'text-2xl' : 'text-xl'}
              bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent
              group-hover:from-primary group-hover:to-primary/80
            `}
          >
            {article.title}
          </h3>

          {/* Excerpt */}
          <p className="text-muted-foreground leading-relaxed line-clamp-3">
            {article.excerpt}
          </p>

          {/* Meta Information */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground pt-2 border-t border-border/50">
            {/* Author */}
            <div className="flex items-center gap-2">
              {article.author_avatar_url ? (
                <Image
                  src={article.author_avatar_url}
                  alt={article.author_name}
                  width={24}
                  height={24}
                  className="rounded-full"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                  {article.author_name.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="font-medium">{article.author_name}</span>
            </div>

            {/* Read Time */}
            {article.read_time_minutes && (
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{article.read_time_minutes} min read</span>
              </div>
            )}

            {/* View Count */}
            {article.view_count > 0 && (
              <div className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                <span>{article.view_count.toLocaleString()} views</span>
              </div>
            )}

            {/* Published Date */}
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>{formattedDate}</span>
            </div>
          </div>

          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {article.tags.slice(0, 3).map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="text-xs bg-primary/10 text-primary border-primary/20 hover:bg-primary/20"
                >
                  #{tag}
                </Badge>
              ))}
              {article.tags.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{article.tags.length - 3} more
                </Badge>
              )}
            </div>
          )}
        </CardContent>

        {/* Hover Effect Decorations */}
        <div className="absolute top-2 right-2 w-16 h-16 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-all duration-500" />
        <div className="absolute bottom-2 left-2 w-12 h-12 bg-gradient-to-tr from-primary/5 to-transparent rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-all duration-700" />
      </Card>
    </Link>
  );
}

