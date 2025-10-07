'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Clock, Calendar, Eye, ArrowLeft, ChevronUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import ArticleContent from '@/components/hub/ArticleContent';
import ShareButtons from '@/components/hub/ShareButtons';
import TableOfContents from '@/components/hub/TableOfContents';
import RelatedArticles from '@/components/hub/RelatedArticles';
import { Article, CATEGORY_METADATA } from '@/types/article';
import { formatDistanceToNow } from 'date-fns';

interface ArticleDetailClientProps {
  article: Article;
}

export default function ArticleDetailClient({ article }: ArticleDetailClientProps) {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const categoryMeta = CATEGORY_METADATA[article.category];
  const formattedDate = article.published_at
    ? formatDistanceToNow(new Date(article.published_at), { addSuffix: true })
    : '';

  // Track scroll progress
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = (scrollTop / docHeight) * 100;
      setScrollProgress(Math.min(100, Math.max(0, scrollPercent)));
      setShowScrollTop(scrollTop > 500);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Increment view count
  useEffect(() => {
    const incrementView = async () => {
      try {
        await fetch(`/api/hub/articles/${article.slug}/view`, {
          method: 'POST',
        });
      } catch (error) {
        console.error('Error incrementing view count:', error);
      }
    };

    incrementView();
  }, [article.slug]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // JSON-LD structured data for SEO
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.excerpt,
    image: article.featured_image_url,
    datePublished: article.published_at,
    dateModified: article.updated_at,
    author: {
      '@type': 'Person',
      name: article.author_name,
      ...(article.author_avatar_url && { image: article.author_avatar_url }),
    },
    publisher: {
      '@type': 'Organization',
      name: 'VoyageSmart',
      logo: {
        '@type': 'ImageObject',
        url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://voyagesmart.app'}/images/logo-voyage_smart.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${process.env.NEXT_PUBLIC_APP_URL || 'https://voyagesmart.app'}/hub/${article.slug}`,
    },
    keywords: article.tags?.join(', '),
  };

  return (
    <>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-20 right-20 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse-slow" />
          <div className="absolute bottom-40 left-20 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }} />
        </div>

        {/* Scroll Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-muted z-50">
        <div
          className="h-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-150"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Hero Section - Enhanced */}
      <section className="relative w-full h-[600px] md:h-[700px] overflow-hidden">
        {article.featured_image_url && (
          <>
            {/* Image with parallax effect */}
            <div className="absolute inset-0 z-0 scale-110">
              <Image
                src={article.featured_image_url}
                alt={article.title}
                fill
                className="object-cover transition-transform duration-700 hover:scale-105"
                priority
                sizes="100vw"
              />
            </div>
            {/* Multi-layer gradients for depth */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/70 to-black/50 z-10" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent z-10" />
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-purple-500/20 z-10 mix-blend-overlay" />
          </>
        )}

        {/* Decorative Elements */}
        <div className="absolute top-10 right-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl z-10 animate-pulse-slow" />
        <div className="absolute bottom-20 left-10 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl z-10 animate-pulse-slow" style={{ animationDelay: '1s' }} />

        <div className="relative z-20 container mx-auto px-4 sm:px-6 h-full flex flex-col justify-end pb-16">
          {/* Breadcrumbs - Enhanced */}
          <div className="mb-8 animate-fade-in-up">
            <Link
              href="/hub"
              className="inline-flex items-center gap-2 text-white/90 hover:text-white transition-all duration-300 group bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 hover:bg-white/20 hover:border-white/30"
            >
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
              <span className="font-medium">Back to Travel Hub</span>
            </Link>
          </div>

          {/* Category Badge - Enhanced */}
          <div className="mb-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <Badge
              className="text-sm px-5 py-2.5 backdrop-blur-xl border-2 shadow-2xl font-semibold tracking-wide uppercase transition-all duration-300 hover:scale-105"
              style={{
                backgroundColor: `${categoryMeta.color}40`,
                borderColor: `${categoryMeta.color}80`,
                color: '#ffffff',
                boxShadow: `0 0 30px ${categoryMeta.color}40`
              }}
            >
              <span className="mr-2">{categoryMeta.icon}</span>
              {categoryMeta.name}
            </Badge>
          </div>

          {/* Title - Enhanced */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black leading-[1.1] text-white drop-shadow-2xl max-w-5xl mb-8 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <span className="bg-gradient-to-r from-white via-white to-white/90 bg-clip-text text-transparent">
              {article.title}
            </span>
          </h1>

          {/* Subtitle - Enhanced */}
          {article.subtitle && (
            <p className="text-xl md:text-2xl lg:text-3xl text-white/95 leading-relaxed max-w-4xl mb-8 drop-shadow-xl font-light animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
              {article.subtitle}
            </p>
          )}

          {/* Meta Info - Enhanced */}
          <div className="flex flex-wrap items-center gap-6 text-white/90 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            {/* Author */}
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-3 rounded-full border border-white/20 hover:bg-white/15 transition-all duration-300">
              {article.author_avatar_url ? (
                <Image
                  src={article.author_avatar_url}
                  alt={article.author_name}
                  width={48}
                  height={48}
                  className="rounded-full border-2 border-white/40 shadow-lg"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center font-bold text-white border-2 border-white/40 shadow-lg text-lg">
                  {article.author_name.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <p className="font-semibold text-white">{article.author_name}</p>
                {formattedDate && (
                  <p className="text-sm text-white/70">{formattedDate}</p>
                )}
              </div>
            </div>

            {/* Read Time */}
            {article.read_time_minutes && (
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-3 rounded-full border border-white/20">
                <Clock className="h-5 w-5" />
                <span className="font-medium">{article.read_time_minutes} min read</span>
              </div>
            )}

            {/* View Count */}
            {article.view_count > 0 && (
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-3 rounded-full border border-white/20">
                <Eye className="h-5 w-5" />
                <span className="font-medium">{article.view_count.toLocaleString()} views</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Article Content - Enhanced */}
      <div className="relative container mx-auto px-4 sm:px-6 py-16 md:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
          {/* Main Content */}
          <article className="lg:col-span-8">
            {/* Share Buttons - Enhanced */}
            <div className="mb-12 pb-8 border-b-2 border-gradient-to-r from-primary/20 via-primary/10 to-transparent">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <h3 className="text-lg font-semibold text-foreground/80">Share this article</h3>
                <ShareButtons
                  title={article.title}
                  url={`/hub/${article.slug}`}
                  description={article.excerpt}
                />
              </div>
            </div>

            {/* Article Body - Enhanced Container */}
            <div className="prose prose-lg dark:prose-invert max-w-none">
              <ArticleContent content={article.content} />
            </div>

            {/* Tags - Enhanced */}
            {article.tags && article.tags.length > 0 && (
              <div className="mt-16 pt-10 border-t-2 border-gradient-to-r from-primary/20 via-primary/10 to-transparent">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-1 h-8 bg-gradient-to-b from-primary to-primary/50 rounded-full" />
                  <h3 className="text-2xl font-bold">Related Topics</h3>
                </div>
                <div className="flex flex-wrap gap-3">
                  {article.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="text-sm px-4 py-2 bg-gradient-to-r from-primary/10 to-primary/5 text-primary border-2 border-primary/20 hover:bg-primary/20 hover:border-primary/30 cursor-pointer transition-all duration-300 hover:scale-105 font-medium"
                    >
                      #{tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* CTA Box - Enhanced */}
            <div className="mt-16 p-10 bg-gradient-to-br from-primary/15 via-primary/10 to-purple-500/10 rounded-3xl border-2 border-primary/30 shadow-2xl relative overflow-hidden group hover:shadow-primary/20 transition-all duration-500">
              {/* Decorative Elements */}
              <div className="absolute top-0 right-0 w-40 h-40 bg-primary/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />

              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-1.5 h-12 bg-gradient-to-b from-primary to-purple-500 rounded-full" />
                  <h3 className="text-3xl font-black bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                    Ready to Plan Your Trip?
                  </h3>
                </div>
                <p className="text-lg text-muted-foreground mb-8 leading-relaxed max-w-2xl">
                  Use VoyageSmart to organize your itinerary, track expenses, and collaborate with travel companions. Start planning your dream adventure today!
                </p>
                <Link href="/register">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-primary via-primary/90 to-purple-600 hover:from-primary/90 hover:via-primary hover:to-purple-500 text-white px-10 py-7 rounded-2xl text-lg font-bold shadow-2xl hover:shadow-primary/30 transition-all duration-300 hover:scale-105 group"
                  >
                    <span>Start Planning Free</span>
                    <ArrowLeft className="ml-2 h-5 w-5 rotate-180 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
              </div>
            </div>
          </article>

          {/* Sidebar - Enhanced */}
          <aside className="lg:col-span-4">
            <div className="sticky top-24 space-y-8">
              <TableOfContents content={article.content} />
            </div>
          </aside>
        </div>
      </div>

      {/* Related Articles */}
      <RelatedArticles
        currentArticleId={article.id}
        category={article.category}
      />

      {/* Scroll to Top Button - Enhanced */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 p-5 bg-gradient-to-br from-primary to-primary/90 text-white rounded-2xl shadow-2xl hover:shadow-primary/40 transition-all duration-300 hover:scale-110 hover:-translate-y-1 z-50 animate-fade-in group border-2 border-white/20 backdrop-blur-sm"
          aria-label="Scroll to top"
        >
          <ChevronUp className="h-6 w-6 transition-transform group-hover:-translate-y-1" />
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </button>
      )}
      </main>
    </>
  );
}

