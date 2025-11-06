'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  RefreshCw,
  Search,
  Grid3x3,
  List,
  Eye,
  EyeOff,
  Filter,
  Plus,
  Tag,
  Heart,
  MessageCircle,
  Calendar,
  ExternalLink,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface InstagramPost {
  id: string;
  shortCode: string;
  postUrl: string;
  caption: string | null;
  type: string;
  imageUrl: string | null;
  videoUrl: string | null;
  carouselImages: any[] | null;
  hashtags: string[] | null;
  mentions: string[] | null;
  locationName: string | null;
  likes: number;
  comments: number;
  timestamp: string;
  websiteEnabled: boolean;
  customTitle: string | null;
  customDescription: string | null;
  displayOrder: number;
  lastSyncedAt: string;
  createdAt: string;
  categories: Array<{
    id: string;
    name: string;
    color: string | null;
    icon: string | null;
  }>;
}

interface Category {
  id: string;
  name: string;
  color: string | null;
  icon: string | null;
  postCount?: number;
}

interface SyncStats {
  totalPosts: number;
  publishedPosts: number;
  categorizedPosts: number;
  uncategorizedPosts: number;
  lastSyncedAt: string | null;
}

export default function InstagramPostsPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<InstagramPost[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [syncStats, setSyncStats] = useState<SyncStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [websiteFilter, setWebsiteFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Fetch data
  useEffect(() => {
    fetchData();
  }, [selectedCategory, websiteFilter, typeFilter, searchQuery]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Build query parameters
      const params = new URLSearchParams();
      if (selectedCategory && selectedCategory !== 'all') {
        params.append('categoryId', selectedCategory);
      }
      if (websiteFilter !== 'all') {
        params.append('websiteEnabled', websiteFilter);
      }
      if (typeFilter && typeFilter !== 'all') {
        params.append('type', typeFilter);
      }
      if (searchQuery) {
        params.append('search', searchQuery);
      }
      params.append('limit', '50');

      const [postsRes, categoriesRes, statsRes] = await Promise.all([
        fetch(`/api/admin/posts/instagram?${params}`),
        fetch('/api/admin/posts/categories?includePostCount=true'),
        fetch('/api/admin/posts/instagram/sync'),
      ]);

      if (postsRes.ok) {
        const data = await postsRes.json();
        setPosts(data.posts || []);
      }

      if (categoriesRes.ok) {
        const data = await categoriesRes.json();
        setCategories(data.categories || []);
      }

      if (statsRes.ok) {
        const data = await statsRes.json();
        setSyncStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch('/api/admin/posts/instagram/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ forceFetch: false }),
      });

      if (res.ok) {
        const data = await res.json();
        setSyncStats(data.stats);
        await fetchData();
      } else {
        alert('Sync failed. Please try again.');
      }
    } catch (error) {
      console.error('Sync error:', error);
      alert('Sync failed. Please try again.');
    } finally {
      setSyncing(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Instagram Posts</h1>
          <p className="text-muted-foreground">
            Categorize and manage your Instagram content for website publishing
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/posts/categories">
              <Tag className="mr-2 h-4 w-4" />
              Manage Categories
            </Link>
          </Button>
          <Button onClick={handleSync} disabled={syncing}>
            <RefreshCw className={cn('mr-2 h-4 w-4', syncing && 'animate-spin')} />
            Sync Posts
          </Button>
        </div>
      </div>

      {/* Stats */}
      {syncStats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{syncStats.totalPosts}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Published</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{syncStats.publishedPosts}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Categorized</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{syncStats.categorizedPosts}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Uncategorized</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{syncStats.uncategorizedPosts}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              <CardTitle>Filters</CardTitle>
            </div>
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid3x3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search posts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name} {cat.postCount !== undefined && `(${cat.postCount})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={websiteFilter} onValueChange={setWebsiteFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Publishing Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Posts</SelectItem>
                <SelectItem value="true">Published to Website</SelectItem>
                <SelectItem value="false">Not Published</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Post Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="image">Images</SelectItem>
                <SelectItem value="video">Videos</SelectItem>
                <SelectItem value="Sidecar">Carousels</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Posts Grid/List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : posts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">No posts found</p>
            <Button onClick={handleSync}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Sync Posts from Instagram
            </Button>
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <Card key={post.id} className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow">
              {post.imageUrl && (
                <div className="relative aspect-square">
                  <img
                    src={post.imageUrl}
                    alt={post.caption || 'Instagram post'}
                    className="object-cover w-full h-full"
                  />
                  {post.websiteEnabled && (
                    <div className="absolute top-2 right-2">
                      <Badge variant="secondary" className="bg-green-500 text-white">
                        <Eye className="h-3 w-3 mr-1" />
                        Published
                      </Badge>
                    </div>
                  )}
                  {post.carouselImages && post.carouselImages.length > 1 && (
                    <div className="absolute top-2 left-2">
                      <Badge variant="secondary">
                        Carousel ({post.carouselImages.length})
                      </Badge>
                    </div>
                  )}
                </div>
              )}
              <CardContent className="p-4">
                <p className="text-sm line-clamp-2 mb-3">
                  {post.customTitle || post.caption || 'No caption'}
                </p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                  <span className="flex items-center gap-1">
                    <Heart className="h-3 w-3" />
                    {post.likes.toLocaleString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageCircle className="h-3 w-3" />
                    {post.comments.toLocaleString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(post.timestamp)}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {post.categories.slice(0, 3).map((cat) => (
                    <Badge key={cat.id} variant="outline" style={{ borderColor: cat.color || undefined }}>
                      {cat.name}
                    </Badge>
                  ))}
                  {post.categories.length > 3 && (
                    <Badge variant="outline">+{post.categories.length - 3}</Badge>
                  )}
                  {post.categories.length === 0 && (
                    <Badge variant="secondary">Uncategorized</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <Card key={post.id} className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardContent className="p-4">
                <div className="flex gap-4">
                  {post.imageUrl && (
                    <div className="relative w-32 h-32 flex-shrink-0">
                      <img
                        src={post.imageUrl}
                        alt={post.caption || 'Instagram post'}
                        className="object-cover w-full h-full rounded"
                      />
                      {post.carouselImages && post.carouselImages.length > 1 && (
                        <Badge variant="secondary" className="absolute bottom-1 right-1 text-xs">
                          {post.carouselImages.length}
                        </Badge>
                      )}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1">
                        <p className="font-medium line-clamp-2">
                          {post.customTitle || post.caption || 'No caption'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(post.timestamp)}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {post.websiteEnabled ? (
                          <Badge variant="secondary" className="bg-green-500 text-white">
                            <Eye className="h-3 w-3 mr-1" />
                            Published
                          </Badge>
                        ) : (
                          <Badge variant="outline">
                            <EyeOff className="h-3 w-3 mr-1" />
                            Draft
                          </Badge>
                        )}
                        <Button size="sm" variant="ghost" asChild>
                          <a href={post.postUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                      <span className="flex items-center gap-1">
                        <Heart className="h-4 w-4" />
                        {post.likes.toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="h-4 w-4" />
                        {post.comments.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {post.categories.map((cat) => (
                        <Badge key={cat.id} variant="outline" style={{ borderColor: cat.color || undefined }}>
                          {cat.name}
                        </Badge>
                      ))}
                      {post.categories.length === 0 && (
                        <Badge variant="secondary">Uncategorized</Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
