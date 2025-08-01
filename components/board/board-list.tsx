'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
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

  // 게시글 카드 컴포넌트 (반응형 최적화)
  const PostCard = ({ post, isPinned = false }: { post: BoardPost; isPinned?: boolean }) => {
    // UI 상태 가져오기 (없으면 실제 데이터 기준)
    const uiState = likeUIStates[post.postId] || { isLiked: post.isLiked, pendingChange: 0 };
    
    return (
    <Card 
      className="group hover:shadow-lg hover:scale-[1.02] transition-all duration-200 cursor-pointer h-full border-0 shadow-sm bg-white dark:bg-gray-900"
      onClick={() => {
        saveScrollPosition();
        router.push(`/board/posts/${post.postId}`);
      }}
    >
      <CardContent className="p-0 flex flex-col h-full">
        {/* 1. 썸네일 또는 텍스트 미리보기 - 반응형 종횡비 */}
        <div className="relative overflow-hidden rounded-t-lg">
          {post.thumbnailUrl ? (
            <div className="aspect-[16/9] sm:aspect-[4/3] md:aspect-[16/9] relative">
              <img 
                src={post.thumbnailUrl} 
                alt="썸네일"
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              {/* 오버레이 그라데이션 */}
              <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors duration-200" />
            </div>
          ) : (
            <div className="aspect-[16/9] sm:aspect-[4/3] md:aspect-[16/9] bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center p-4 sm:p-6">
              <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base line-clamp-3 sm:line-clamp-4 text-center leading-relaxed">
                {post.contentPreview || '내용 미리보기가 없습니다.'}
              </p>
            </div>
          )}
          {/* 카테고리와 핀 정보 - 절대 위치 */}
          <div className="absolute top-3 left-3 flex items-center gap-2">
            {isPinned && (
              <div className="bg-orange-500 text-white p-1.5 rounded-full shadow-lg">
                <Pin className="h-3 w-3" />
              </div>
            )}
            {post.categoryName && (
              <Badge variant="secondary" className="text-xs font-medium bg-white/90 backdrop-blur-sm text-blue-700 border-0 shadow-sm px-2 py-1">
                {post.categoryName}
              </Badge>
            )}
          </div>
        </div>
        
        {/* 2. 콘텐츠 영역 */}
        <div className="p-4 sm:p-5 flex flex-col flex-1">
          {/* 제목 - 반응형 텍스트 크기 */}
          <h3 className="font-bold text-base sm:text-lg lg:text-xl mb-2 sm:mb-3 line-clamp-2 text-gray-900 dark:text-gray-100 leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">
            {post.title}
          </h3>
          
          {/* 작성자 정보 - 모바일 최적화 */}
          <div className="mb-3 sm:mb-4">
            <div className="flex items-center gap-1.5 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              <User className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
              {post.serverNumber && post.allianceTag && (
                <span className="inline-flex items-center px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full border border-blue-200 dark:border-blue-800 mr-1 flex-shrink-0">
                  {post.serverNumber}서버 [{post.allianceTag}]
                </span>
              )}
              <span className="font-medium truncate">{post.authorName}</span>
            </div>
          </div>
          
          {/* 하단: 메타데이터 - 터치 친화적 */}
          <div className="flex items-center justify-between text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-auto pt-3 border-t border-gray-100 dark:border-gray-800">
            <span className="flex items-center gap-1 flex-shrink-0">
              <Calendar className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              <span className="hidden sm:inline">
                {formatDistanceToNow(new Date(post.createdAt), { 
                  addSuffix: true, 
                  locale: ko 
                })}
              </span>
              <span className="sm:hidden">
                {formatDistanceToNow(new Date(post.createdAt), { 
                  addSuffix: true, 
                  locale: ko 
                }).replace('약 ', '')}
              </span>
            </span>
            
            <div className="flex items-center gap-2 sm:gap-4">
              <span className="flex items-center gap-1">
                <Eye className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                <span className="font-medium">{post.viewCount > 999 ? `${Math.floor(post.viewCount / 1000)}k` : post.viewCount}</span>
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleLikeToggle(post.postId);
                }}
                className={`flex items-center gap-1 hover:text-red-500 transition-colors duration-200 min-h-[44px] sm:min-h-[auto] -m-2 p-2 sm:m-0 sm:p-0 ${
                  uiState.isLiked ? 'text-red-500' : ''
                }`}
                aria-label={`좋아요 ${uiState.isLiked ? '취소' : '추가'}`}
              >
                <Heart className={`h-3 w-3 sm:h-3.5 sm:w-3.5 transition-all duration-200 ${uiState.isLiked ? 'fill-current scale-110' : 'hover:scale-110'}`} />
                <span className="font-medium">{(post.likeCount + uiState.pendingChange) > 999 ? `${Math.floor((post.likeCount + uiState.pendingChange) / 1000)}k` : (post.likeCount + uiState.pendingChange)}</span>
              </button>
              <span className="flex items-center gap-1">
                <MessageCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                <span className="font-medium">{post.commentCount > 999 ? `${Math.floor(post.commentCount / 1000)}k` : post.commentCount}</span>
              </span>
            </div>
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
    <div className="px-3 sm:px-4 lg:px-6" ref={containerRef}>
      {/* 헤더 */}
      <div className="flex justify-between items-center mb-4 sm:mb-6">
        <div></div>
        {showCreateButton && (
          <Button 
            onClick={() => router.push('/board/posts/new')}
            className="min-h-[44px] px-4 sm:px-6 font-medium"
          >
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden xs:inline">글 쓰기</span>
            <span className="xs:hidden">글쓰기</span>
          </Button>
        )}
      </div>

      {/* 검색 영역 */}
      <Card className="mb-4 sm:mb-6">
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-col gap-3 sm:gap-4">
            {/* 검색 */}
            <div className="flex gap-2">
              <Input
                placeholder="검색어를 입력하세요..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="min-h-[44px] text-base sm:text-sm"
              />
              <Button 
                onClick={handleSearch} 
                variant="outline" 
                size="icon"
                className="min-h-[44px] min-w-[44px] flex-shrink-0"
                aria-label="검색"
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>

            {/* 정렬 옵션 */}
            <div className="flex justify-end">
              <Select
                value={filters.sortBy}
                onValueChange={(value) => handleFilterChange('sortBy', value)}
              >
                <SelectTrigger className="w-28 sm:w-32 min-h-[44px] text-sm">
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
      <Card className="mb-4 sm:mb-6">
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <Button
              variant={!filters.categoryId ? "default" : "outline"}
              size="sm"
              onClick={() => {
                handleFilterChange('categoryId', undefined);
                onCategorySelect?.(undefined);
              }}
              className="rounded-full min-h-[36px] sm:min-h-[32px] px-3 sm:px-4 text-sm font-medium"
            >
              전체
            </Button>
            {categories.map(category => (
              <Button
                key={category.categoryId}
                variant={filters.categoryId === category.categoryId ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  handleFilterChange('categoryId', category.categoryId);
                  onCategorySelect?.(category.categoryId);
                }}
                className="rounded-full min-h-[36px] sm:min-h-[32px] px-3 sm:px-4 text-sm font-medium"
              >
                {category.categoryName}
              </Button>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
            {pinnedPosts.map(post => (
              <PostCard key={post.postId} post={post} isPinned />
            ))}
          </div>
        </div>
      )}

      {/* 게시글 목록 */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="h-full border-0 shadow-sm">
              <CardContent className="p-0">
                <div className="space-y-0">
                  {/* 썸네일 스켈레톤 */}
                  <Skeleton className="w-full aspect-[16/9] sm:aspect-[4/3] md:aspect-[16/9] rounded-t-lg rounded-b-none" />
                  
                  {/* 콘텐츠 영역 */}
                  <div className="p-4 sm:p-5 space-y-3">
                    {/* 제목 */}
                    <div className="space-y-2">
                      <Skeleton className="h-5 sm:h-6 w-full" />
                      <Skeleton className="h-5 sm:h-6 w-3/4" />
                    </div>
                    
                    {/* 작성자 정보 */}
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-3 w-3 rounded-full" />
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                    
                    {/* 메타데이터 */}
                    <div className="flex justify-between items-center pt-3 border-t">
                      <Skeleton className="h-3 w-16" />
                      <div className="flex gap-3">
                        <Skeleton className="h-3 w-8" />
                        <Skeleton className="h-3 w-8" />
                        <Skeleton className="h-3 w-8" />
                      </div>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6">
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