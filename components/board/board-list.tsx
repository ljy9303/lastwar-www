'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { AdvancedPagination } from '@/components/ui/advanced-pagination';
import { 
  Heart, 
  MessageCircle, 
  Eye, 
  Pin, 
  Search, 
  Plus,
  Filter,
  Calendar,
  User
} from 'lucide-react';
import { boardApi } from '@/lib/board-api';
import { BoardPost, BoardCategory, BoardFilters, PagedResponse } from '@/types/board';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

interface BoardListProps {
  categoryId?: number;
  title?: string;
  showCreateButton?: boolean;
}

export function BoardList({ categoryId, title = '게시글 목록', showCreateButton = true }: BoardListProps) {
  const router = useRouter();
  const [posts, setPosts] = useState<PagedResponse<BoardPost> | null>(null);
  const [categories, setCategories] = useState<BoardCategory[]>([]);
  const [pinnedPosts, setPinnedPosts] = useState<BoardPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<BoardFilters>({
    categoryId: categoryId,
    searchKeyword: '',
    sortBy: 'latest',
    page: 1,
    size: 20
  });

  const [searchInput, setSearchInput] = useState('');

  // 데이터 로드
  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // 병렬로 데이터 로드
      const [postsResponse, categoriesResponse, pinnedResponse] = await Promise.all([
        boardApi.getPosts(filters.categoryId, filters.page, filters.size, filters.sortBy),
        boardApi.getCategories(),
        boardApi.getPinnedPosts()
      ]);

      setPosts(postsResponse);
      setCategories(categoriesResponse);
      setPinnedPosts(pinnedResponse);
    } catch (err) {
      console.error('게시글 목록 로드 실패:', err);
      setError(err instanceof Error ? err.message : '데이터를 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 검색 실행
  const handleSearch = async () => {
    if (!searchInput.trim()) {
      // 검색어가 없으면 일반 목록 조회
      setFilters(prev => ({ ...prev, searchKeyword: '', page: 1 }));
      return;
    }

    try {
      setIsLoading(true);
      const searchResponse = await boardApi.searchPosts({
        keyword: searchInput,
        categoryId: filters.categoryId,
        searchType: 'all',
        sortBy: filters.sortBy,
        page: 1,
        size: filters.size
      });
      
      setPosts(searchResponse);
      setFilters(prev => ({ ...prev, searchKeyword: searchInput, page: 1 }));
    } catch (err) {
      console.error('게시글 검색 실패:', err);
      setError(err instanceof Error ? err.message : '검색에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 좋아요 토글
  const handleLikeToggle = async (postId: number) => {
    try {
      await boardApi.togglePostLike(postId);
      
      // 게시글 목록에서 좋아요 상태 업데이트
      setPosts(prev => {
        if (!prev) return prev;
        
        return {
          ...prev,
          content: prev.content.map(post => 
            post.postId === postId 
              ? { 
                  ...post, 
                  isLiked: !post.isLiked,
                  likeCount: post.isLiked ? post.likeCount - 1 : post.likeCount + 1
                }
              : post
          )
        };
      });
    } catch (err) {
      console.error('좋아요 처리 실패:', err);
    }
  };

  // 필터 변경 처리
  const handleFilterChange = (key: keyof BoardFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  // 페이지 변경 처리
  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  // 초기 로드 및 필터 변경 시 데이터 로드
  useEffect(() => {
    loadData();
  }, [filters]);

  // 게시글 카드 컴포넌트
  const PostCard = ({ post, isPinned = false }: { post: BoardPost; isPinned?: boolean }) => (
    <Card className="hover:shadow-md transition-shadow cursor-pointer">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* 썸네일 */}
          {post.thumbnailUrl && (
            <div className="flex-shrink-0">
              <img 
                src={post.thumbnailUrl} 
                alt="썸네일"
                className="w-16 h-16 object-cover rounded-md"
              />
            </div>
          )}
          
          {/* 메인 콘텐츠 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              {isPinned && <Pin className="h-4 w-4 text-orange-500" />}
              {post.categoryName && (
                <Badge variant="secondary" className="text-xs">
                  {post.categoryName}
                </Badge>
              )}
            </div>
            
            <Link href={`/board/posts/${post.postId}`}>
              <h3 className="font-semibold text-lg mb-1 hover:text-blue-600 line-clamp-2">
                {post.title}
              </h3>
            </Link>
            
            {post.contentPreview && (
              <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                {post.contentPreview}
              </p>
            )}
            
            {/* 메타데이터 */}
            <div className="flex items-center justify-between text-sm text-gray-500">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {post.authorName}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDistanceToNow(new Date(post.createdAt), { 
                    addSuffix: true, 
                    locale: ko 
                  })}
                </span>
              </div>
              
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  {post.viewCount}
                </span>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    handleLikeToggle(post.postId);
                  }}
                  className={`flex items-center gap-1 hover:text-red-500 transition-colors ${
                    post.isLiked ? 'text-red-500' : ''
                  }`}
                >
                  <Heart className={`h-3 w-3 ${post.isLiked ? 'fill-current' : ''}`} />
                  {post.likeCount}
                </button>
                <span className="flex items-center gap-1">
                  <MessageCircle className="h-3 w-3" />
                  {post.commentCount}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <EmptyState
          title="오류가 발생했습니다"
          description={error}
          action={{
            label: '다시 시도',
            onClick: loadData
          }}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 헤더 */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{title}</h1>
        {showCreateButton && (
          <Button onClick={() => router.push('/board/posts/new')}>
            <Plus className="h-4 w-4 mr-2" />
            글 쓰기
          </Button>
        )}
      </div>

      {/* 검색 및 필터 */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* 검색 */}
            <div className="flex-1 flex gap-2">
              <Input
                placeholder="검색어를 입력하세요..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button onClick={handleSearch} variant="outline">
                <Search className="h-4 w-4" />
              </Button>
            </div>

            {/* 필터 */}
            <div className="flex gap-2">
              <Select
                value={filters.categoryId?.toString() || 'all'}
                onValueChange={(value) => 
                  handleFilterChange('categoryId', value === 'all' ? undefined : parseInt(value))
                }
              >
                <SelectTrigger className="w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="카테고리" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체 카테고리</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category.categoryId} value={category.categoryId.toString()}>
                      {category.categoryName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filters.sortBy}
                onValueChange={(value) => handleFilterChange('sortBy', value)}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="latest">최신순</SelectItem>
                  <SelectItem value="popular">인기순</SelectItem>
                  <SelectItem value="views">조회순</SelectItem>
                  <SelectItem value="comments">댓글순</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 고정 게시글 */}
      {pinnedPosts.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Pin className="h-5 w-5 text-orange-500" />
            고정 게시글
          </h2>
          <div className="space-y-3">
            {pinnedPosts.map(post => (
              <PostCard key={post.postId} post={post} isPinned />
            ))}
          </div>
        </div>
      )}

      {/* 게시글 목록 */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex gap-3">
                  <Skeleton className="w-16 h-16 rounded-md" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <div className="flex gap-4">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !posts || posts.content.length === 0 ? (
        <EmptyState
          title="게시글이 없습니다"
          description={filters.searchKeyword ? 
            `'${filters.searchKeyword}'에 대한 검색 결과가 없습니다.` : 
            '첫 번째 게시글을 작성해보세요!'
          }
          action={showCreateButton ? {
            label: '글 쓰기',
            onClick: () => router.push('/board/posts/new')
          } : undefined}
        />
      ) : (
        <>
          <div className="space-y-4 mb-6">
            {posts.content.map(post => (
              <PostCard key={post.postId} post={post} />
            ))}
          </div>

          {/* 페이지네이션 */}
          <AdvancedPagination
            currentPage={posts.pagination.currentPage}
            totalPages={posts.pagination.totalPages}
            totalCount={posts.pagination.totalCount}
            pageSize={posts.pagination.pageSize}
            onPageChange={handlePageChange}
          />
        </>
      )}
    </div>
  );
}