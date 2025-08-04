'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { OptimizedTouchButton } from '@/components/ui/optimized-touch-button';
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
  onCategorySelect?: (categoryId: number | undefined) => void;
}

export function BoardList({ categoryId, title = '게시글 목록', showCreateButton = true, onCategorySelect }: BoardListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [posts, setPosts] = useState<PagedResponse<BoardPost> | null>(null);
  const [categories, setCategories] = useState<BoardCategory[]>([]);
  const [pinnedPosts, setPinnedPosts] = useState<BoardPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 좋아요 UI 상태 관리 (postId -> pendingChange)
  const [likeUIStates, setLikeUIStates] = useState<Record<number, { isLiked: boolean; pendingChange: number }>>({});

  // URL에서 상태 초기화
  const initFiltersFromURL = (): BoardFilters => {
    return {
      categoryId: categoryId || (searchParams.get('categoryId') ? parseInt(searchParams.get('categoryId')!) : undefined),
      searchKeyword: searchParams.get('search') || '',
      sortBy: searchParams.get('sortBy') || 'latest',
      page: parseInt(searchParams.get('page') || '1'),
      size: parseInt(searchParams.get('size') || '20')
    };
  };

  const [filters, setFilters] = useState<BoardFilters>(initFiltersFromURL());
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');

  // URL 업데이트 함수
  const updateURL = (newFilters: BoardFilters) => {
    const params = new URLSearchParams();
    
    if (newFilters.categoryId) params.set('categoryId', newFilters.categoryId.toString());
    if (newFilters.searchKeyword) params.set('search', newFilters.searchKeyword);
    if (newFilters.sortBy !== 'latest') params.set('sortBy', newFilters.sortBy);
    if (newFilters.page !== 1) params.set('page', newFilters.page.toString());
    if (newFilters.size !== 20) params.set('size', newFilters.size.toString());
    
    const newURL = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
    window.history.replaceState(null, '', newURL);
  };

  // 스크롤 위치 저장
  const saveScrollPosition = () => {
    if (containerRef.current) {
      const scrollTop = containerRef.current.scrollTop || window.scrollY;
      sessionStorage.setItem('boardListScrollPosition', scrollTop.toString());
      sessionStorage.setItem('boardListFilters', JSON.stringify(filters));
      sessionStorage.setItem('boardListSearchInput', searchInput);
    }
  };

  // 스크롤 위치 복원
  const restoreScrollPosition = () => {
    const savedScrollPosition = sessionStorage.getItem('boardListScrollPosition');
    if (savedScrollPosition) {
      setTimeout(() => {
        const scrollTop = parseInt(savedScrollPosition);
        window.scrollTo(0, scrollTop);
        sessionStorage.removeItem('boardListScrollPosition');
      }, 100);
    }
  };

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

  // 좋아요 토글 - UI +1 방식
  const handleLikeToggle = async (postId: number) => {
    // 현재 게시글 상태 찾기
    const currentPost = posts?.content.find(post => post.postId === postId);
    if (!currentPost) return;

    // 현재 UI 상태 가져오기 (없으면 실제 데이터 기준으로 초기화)
    const currentUIState = likeUIStates[postId] || { isLiked: currentPost.isLiked, pendingChange: 0 };
    
    // 즉각적인 UI 반응
    const newIsLiked = !currentUIState.isLiked;
    const pendingChange = newIsLiked 
      ? (currentPost.isLiked ? 0 : 1)  // 좋아요 추가: 원래 좋아요면 변화없음, 아니면 +1
      : (currentPost.isLiked ? -1 : 0); // 좋아요 취소: 원래 좋아요면 -1, 아니면 변화없음

    setLikeUIStates(prev => ({
      ...prev,
      [postId]: {
        isLiked: newIsLiked,
        pendingChange: pendingChange
      }
    }));

    try {
      // 백엔드 API 호출
      await boardApi.togglePostLike(postId);
    } catch (err) {
      console.error('좋아요 처리 실패:', err);
      // 에러 시 원래 상태로 롤백
      setLikeUIStates(prev => ({
        ...prev,
        [postId]: {
          isLiked: currentPost.isLiked,
          pendingChange: 0
        }
      }));
    }
  };

  // 필터 변경 처리
  const handleFilterChange = (key: keyof BoardFilters, value: any) => {
    const newFilters = { ...filters, [key]: value, page: 1 };
    setFilters(newFilters);
    updateURL(newFilters);
  };

  // 페이지 변경 처리
  const handlePageChange = (page: number) => {
    const newFilters = { ...filters, page };
    setFilters(newFilters);
    updateURL(newFilters);
  };

  // 페이지가 뒤로가기 등으로 돌아왔을 때 상태 복원
  useEffect(() => {
    const savedFilters = sessionStorage.getItem('boardListFilters');
    const savedSearchInput = sessionStorage.getItem('boardListSearchInput');
    
    if (savedFilters && !searchParams.toString()) {
      // URL에 파라미터가 없고 저장된 필터가 있으면 복원
      const parsedFilters = JSON.parse(savedFilters);
      setFilters(parsedFilters);
      updateURL(parsedFilters);
      
      if (savedSearchInput) {
        setSearchInput(savedSearchInput);
      }
      
      // 저장된 세션 스토리지 정리
      sessionStorage.removeItem('boardListFilters');
      sessionStorage.removeItem('boardListSearchInput');
    }
  }, []);

  // 초기 로드 및 필터 변경 시 데이터 로드
  useEffect(() => {
    loadData();
  }, [filters]);

  // 데이터 로드 완료 후 스크롤 위치 복원
  useEffect(() => {
    if (!isLoading && posts) {
      restoreScrollPosition();
    }
  }, [isLoading, posts]);

  // 게시글 카드 컴포넌트 (그리드용 세로형)
  const PostCard = ({ post, isPinned = false }: { post: BoardPost; isPinned?: boolean }) => {
    // UI 상태 가져오기 (없으면 실제 데이터 기준)
    const uiState = likeUIStates[post.postId] || { isLiked: post.isLiked, pendingChange: 0 };
    
    return (
    <Card 
      className="hover:shadow-md transition-shadow cursor-pointer h-full"
      onClick={() => {
        saveScrollPosition();
        router.push(`/board/posts/${post.postId}`);
      }}
    >
      <CardContent className="p-4 flex flex-col h-full">
        {/* 1. 카테고리와 핀 정보 */}
        <div className="flex items-center gap-2 mb-3">
          {isPinned && <Pin className="h-4 w-4 text-orange-500" />}
          {post.categoryName && (
            <Badge variant="secondary" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
              {post.categoryName}
            </Badge>
          )}
        </div>
        
        {/* 2. 썸네일 또는 텍스트 미리보기 */}
        <div className="mb-3">
          {post.thumbnailUrl ? (
            <div className="relative w-full h-32 rounded-md overflow-hidden bg-gray-100">
              <img 
                src={post.thumbnailUrl} 
                alt={post.title + " 썸네일"}
                className="w-full h-full object-cover transition-transform hover:scale-105"
                loading="lazy"
                onError={(e) => {
                  // 이미지 로딩 실패 시 대체 컨텐츠 표시
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent) {
                    parent.innerHTML = `
                      <div class="w-full h-full bg-gray-50 flex items-center justify-center p-4">
                        <p class="text-gray-600 text-sm line-clamp-4 text-center">
                          ${post.contentPreview || '이미지를 불러올 수 없습니다.'}
                        </p>
                      </div>
                    `;
                  }
                }}
              />
            </div>
          ) : (
            <div className="w-full h-32 bg-gray-50 rounded-md flex items-center justify-center p-4">
              <p className="text-gray-600 text-sm line-clamp-4 text-center">
                {post.contentPreview || '내용 미리보기가 없습니다.'}
              </p>
            </div>
          )}
        </div>
        
        {/* 3. 제목 */}
        <h3 className="font-semibold text-lg mb-3 line-clamp-2 min-h-[3.5rem] text-gray-900">
          {post.title}
        </h3>
        
        {/* 작성자 정보 */}
        <div className="mb-3">
          <div className="flex items-center gap-1 text-sm text-gray-700">
            <User className="h-3 w-3" />
            {post.serverNumber && post.allianceTag && (
              <span className="inline-block px-2 py-0.5 text-xs bg-blue-50 text-blue-700 rounded border mr-1">
                {post.serverNumber}서버 [{post.allianceTag}]
              </span>
            )}
            <span className="font-medium">{post.authorName}</span>
          </div>
        </div>
        
        {/* 하단: 메타데이터 */}
        <div className="flex items-center justify-between text-sm text-gray-500 mt-auto pt-3 border-t">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {formatDistanceToNow(new Date(post.createdAt), { 
              addSuffix: true, 
              locale: ko 
            })}
          </span>
          
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {post.viewCount}
            </span>
            <OptimizedTouchButton
              variant="ghost"
              size="mobile-icon"
              onClick={(e) => {
                e.stopPropagation(); // 카드 클릭 이벤트 방지
                handleLikeToggle(post.postId);
              }}
              className={`p-1 h-auto min-h-[44px] flex items-center gap-1 hover:text-red-500 transition-colors ${
                uiState.isLiked ? 'text-red-500' : ''
              }`}
            >
              <Heart className={`h-3 w-3 ${uiState.isLiked ? 'fill-current' : ''}`} />
              {post.likeCount + uiState.pendingChange}
            </OptimizedTouchButton>
            <span className="flex items-center gap-1">
              <MessageCircle className="h-3 w-3" />
              {post.commentCount}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
    );
  };

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
    <div className="px-4" ref={containerRef}>
      {/* 헤더 */}
      <div className="flex justify-between items-center mb-6">
        <div></div>
        {showCreateButton && (
          <OptimizedTouchButton 
            size="mobile-default" 
            onClick={() => router.push('/board/posts/new')}
          >
            <Plus className="h-4 w-4 mr-2" />
            글 쓰기
          </OptimizedTouchButton>
        )}
      </div>

      {/* 검색 영역 */}
      <Card className="mb-4">
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
              <OptimizedTouchButton 
                onClick={handleSearch} 
                variant="outline"
                size="mobile-default"
              >
                <Search className="h-4 w-4" />
              </OptimizedTouchButton>
            </div>

            {/* 정렬 옵션 */}
            <div className="flex gap-2">
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

      {/* 카테고리 탭 */}
      <Card className="mb-6">
        <CardContent className="p-2">
          <div className="flex flex-wrap gap-2">
            <OptimizedTouchButton
              variant={!filters.categoryId ? "default" : "outline"}
              size="mobile-sm"
              onClick={() => {
                handleFilterChange('categoryId', undefined);
                onCategorySelect?.(undefined);
              }}
              className="rounded-full"
            >
              전체
            </OptimizedTouchButton>
            {categories.map(category => (
              <OptimizedTouchButton
                key={category.categoryId}
                variant={filters.categoryId === category.categoryId ? "default" : "outline"}
                size="mobile-sm"
                onClick={() => {
                  handleFilterChange('categoryId', category.categoryId);
                  onCategorySelect?.(category.categoryId);
                }}
                className="rounded-full"
              >
                {category.categoryName}
              </OptimizedTouchButton>
            ))}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pinnedPosts.map(post => (
              <PostCard key={post.postId} post={post} isPinned />
            ))}
          </div>
        </div>
      )}

      {/* 게시글 목록 */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="w-full h-32 rounded-md" />
                  <div className="flex justify-between text-sm">
                    <Skeleton className="h-4 w-16" />
                    <div className="flex gap-4">
                      <Skeleton className="h-4 w-12" />
                      <Skeleton className="h-4 w-12" />
                      <Skeleton className="h-4 w-12" />
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
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