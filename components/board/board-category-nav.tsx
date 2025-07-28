'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ChevronDown, 
  ChevronRight, 
  FolderOpen, 
  Folder,
  Hash
} from 'lucide-react';
import { boardApi } from '@/lib/board-api';
import { BoardCategory } from '@/types/board';
import { cn } from '@/lib/utils';

interface BoardCategoryNavProps {
  currentCategoryId?: number;
  onCategorySelect?: (categoryId: number | undefined) => void;
  className?: string;
}

interface CategoryItemProps {
  category: BoardCategory;
  currentCategoryId?: number;
  onCategorySelect?: (categoryId: number | undefined) => void;
  level?: number;
}

// 개별 카테고리 아이템 컴포넌트
function CategoryItem({ 
  category, 
  currentCategoryId, 
  onCategorySelect, 
  level = 0 
}: CategoryItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasSubcategories = category.subcategories && category.subcategories.length > 0;
  const isSelected = currentCategoryId === category.categoryId;

  // 현재 선택된 카테고리의 부모 카테고리인 경우 자동 확장
  useEffect(() => {
    if (currentCategoryId && hasSubcategories) {
      const hasSelectedChild = category.subcategories?.some(
        sub => sub.categoryId === currentCategoryId
      );
      if (hasSelectedChild) {
        setIsExpanded(true);
      }
    }
  }, [currentCategoryId, hasSubcategories, category.subcategories]);

  const handleClick = () => {
    if (onCategorySelect) {
      onCategorySelect(category.categoryId);
    }
    
    // 하위 카테고리가 있으면 토글
    if (hasSubcategories) {
      setIsExpanded(!isExpanded);
    }
  };

  const paddingLeft = level * 16 + 12;

  return (
    <div>
      <button
        onClick={handleClick}
        className={cn(
          "w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 transition-colors",
          isSelected && "bg-blue-50 text-blue-600 font-medium"
        )}
        style={{ paddingLeft }}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {/* 폴더 아이콘 */}
          {hasSubcategories ? (
            isExpanded ? (
              <FolderOpen className="h-4 w-4 text-gray-500 flex-shrink-0" />
            ) : (
              <Folder className="h-4 w-4 text-gray-500 flex-shrink-0" />
            )
          ) : (
            <Hash className="h-4 w-4 text-gray-400 flex-shrink-0" />
          )}

          {/* 카테고리명 */}
          <span className="truncate">{category.categoryName}</span>

          {/* 게시글 수 */}
          {category.postCount !== undefined && category.postCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {category.postCount}
            </Badge>
          )}
        </div>

        {/* 확장/축소 아이콘 */}
        {hasSubcategories && (
          <div className="flex-shrink-0 ml-2">
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-gray-400" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-400" />
            )}
          </div>
        )}
      </button>

      {/* 하위 카테고리 */}
      {hasSubcategories && isExpanded && (
        <div>
          {category.subcategories?.map(subcategory => (
            <CategoryItem
              key={subcategory.categoryId}
              category={subcategory}
              currentCategoryId={currentCategoryId}
              onCategorySelect={onCategorySelect}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function BoardCategoryNav({ 
  currentCategoryId, 
  onCategorySelect, 
  className 
}: BoardCategoryNavProps) {
  const pathname = usePathname();
  const [categories, setCategories] = useState<BoardCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 카테고리 데이터 로드
  const loadCategories = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const categoriesData = await boardApi.getCategories();
      setCategories(categoriesData);
    } catch (err) {
      console.error('카테고리 로드 실패:', err);
      setError(err instanceof Error ? err.message : '카테고리를 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleCategorySelect = (categoryId: number | undefined) => {
    if (onCategorySelect) {
      onCategorySelect(categoryId);
    }
  };

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="text-center text-red-500 text-sm">
            카테고리를 불러올 수 없습니다
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full mt-2"
            onClick={loadCategories}
          >
            다시 시도
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardContent className="p-0">
        {/* 헤더 */}
        <div className="p-4 border-b">
          <h3 className="font-semibold">카테고리</h3>
        </div>

        {/* 전체 카테고리 */}
        <button
          onClick={() => handleCategorySelect(undefined)}
          className={cn(
            "w-full flex items-center gap-2 p-3 text-left hover:bg-gray-50 transition-colors",
            !currentCategoryId && "bg-blue-50 text-blue-600 font-medium"
          )}
        >
          <Hash className="h-4 w-4 text-gray-400" />
          <span>전체 게시글</span>
        </button>

        {/* 카테고리 목록 */}
        <div className="border-t">
          {isLoading ? (
            <div className="p-3 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-4 w-8" />
                </div>
              ))}
            </div>
          ) : categories.length === 0 ? (
            <div className="p-4 text-center text-gray-500 text-sm">
              등록된 카테고리가 없습니다
            </div>
          ) : (
            <div>
              {categories
                .filter(category => !category.parentCategoryId) // 최상위 카테고리만
                .map(category => (
                  <CategoryItem
                    key={category.categoryId}
                    category={category}
                    currentCategoryId={currentCategoryId}
                    onCategorySelect={handleCategorySelect}
                  />
                ))}
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div className="p-3 border-t bg-gray-50 text-xs text-gray-500">
          총 {categories.length}개 카테고리
        </div>
      </CardContent>
    </Card>
  );
}