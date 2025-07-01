"use client"

import * as React from "react"
import { ChevronFirst, ChevronLast } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

interface AdvancedPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  
  // Page size options
  showSizeChanger?: boolean;
  pageSize?: number;
  pageSizeOptions?: number[];
  onPageSizeChange?: (size: number) => void;
  
  // Quick jumper
  showQuickJumper?: boolean;
  
  // Display options
  showTotal?: boolean;
  totalElements?: number;
  showFirstLast?: boolean;
  
  // Styling
  className?: string;
}

export function AdvancedPagination({
  currentPage,
  totalPages,
  onPageChange,
  showSizeChanger = true,
  pageSize = 10,
  pageSizeOptions = [10, 25, 50, 100],
  onPageSizeChange,
  showQuickJumper = true,
  showTotal = true,
  totalElements = 0,
  showFirstLast = true,
  className
}: AdvancedPaginationProps) {
  const [jumpPage, setJumpPage] = React.useState("");
  
  // Convert 0-based API to 1-based UI
  const currentPageDisplay = currentPage + 1;
  
  const generatePageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 5; // Reduced for mobile
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      
      let startPage = Math.max(2, currentPageDisplay - 1);
      let endPage = Math.min(totalPages - 1, currentPageDisplay + 1);
      
      if (currentPageDisplay <= 2) {
        endPage = 3;
      } else if (currentPageDisplay >= totalPages - 1) {
        startPage = totalPages - 2;
      }
      
      if (startPage > 2) {
        pages.push('...');
      }
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
      
      if (endPage < totalPages - 1) {
        pages.push('...');
      }
      
      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  const handlePageClick = (page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPageDisplay) {
      onPageChange(page - 1); // Convert back to 0-based for API
    }
  };

  const handleJumpToPage = () => {
    const page = parseInt(jumpPage);
    if (page >= 1 && page <= totalPages && page !== currentPageDisplay) {
      onPageChange(page - 1);
      setJumpPage("");
    }
  };

  // Keyboard navigation handler
  const handleKeyDown = (event: React.KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        if (currentPageDisplay > 1) {
          handlePageClick(currentPageDisplay - 1);
        }
        break;
      case 'ArrowRight':
        event.preventDefault();
        if (currentPageDisplay < totalPages) {
          handlePageClick(currentPageDisplay + 1);
        }
        break;
      case 'Home':
        event.preventDefault();
        if (currentPageDisplay !== 1) {
          handlePageClick(1);
        }
        break;
      case 'End':
        event.preventDefault();
        if (currentPageDisplay !== totalPages) {
          handlePageClick(totalPages);
        }
        break;
    }
  };

  const handlePageSizeChange = (newSize: string) => {
    const size = parseInt(newSize);
    if (onPageSizeChange) {
      onPageSizeChange(size);
      // Reset to first page when changing page size
      onPageChange(0);
    }
  };

  const pages = generatePageNumbers();

  if (totalPages <= 1 && !showSizeChanger && !showTotal) {
    return null;
  }

  return (
    <div 
      className={cn("flex flex-col gap-4", className)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="navigation"
      aria-label="페이지네이션"
    >
      {/* Total info */}
      {showTotal && totalElements > 0 && (
        <div className="text-sm text-muted-foreground">
          총 {totalElements.toLocaleString()}개 항목 중{' '}
          {((currentPage * pageSize) + 1).toLocaleString()}-
          {Math.min((currentPage + 1) * pageSize, totalElements).toLocaleString()}개 표시
        </div>
      )}
      
      {/* Main pagination controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Page size selector */}
        {showSizeChanger && onPageSizeChange && (
          <div className="flex items-center gap-2">
            <Label htmlFor="page-size" className="text-sm whitespace-nowrap">
              페이지당:
            </Label>
            <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
              <SelectTrigger id="page-size" className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((size) => (
                  <SelectItem key={size} value={size.toString()}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Pagination controls */}
        {totalPages > 1 && (
          <Pagination>
            <PaginationContent>
              {/* First page button */}
              {showFirstLast && (
                <PaginationItem>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handlePageClick(1)}
                    disabled={currentPageDisplay === 1}
                    className="h-9 w-9"
                    aria-label="첫 페이지로 이동"
                    title="첫 페이지로 이동 (Home 키)"
                  >
                    <ChevronFirst className="h-4 w-4" />
                  </Button>
                </PaginationItem>
              )}

              {/* Previous button */}
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => handlePageClick(currentPageDisplay - 1)}
                  className={cn(
                    "cursor-pointer",
                    currentPageDisplay === 1 && "opacity-50 cursor-not-allowed"
                  )}
                  aria-label="이전 페이지로 이동"
                  title="이전 페이지로 이동 (← 키)"
                />
              </PaginationItem>

              {/* Page numbers */}
              <div className="hidden sm:flex">
                {pages.map((page, index) => (
                  <PaginationItem key={index}>
                    {page === '...' ? (
                      <PaginationEllipsis />
                    ) : (
                      <PaginationLink
                        onClick={() => handlePageClick(page as number)}
                        isActive={page === currentPageDisplay}
                        className="cursor-pointer"
                        aria-label={`${page}페이지로 이동`}
                        aria-current={page === currentPageDisplay ? "page" : undefined}
                      >
                        {page}
                      </PaginationLink>
                    )}
                  </PaginationItem>
                ))}
              </div>

              {/* Mobile page indicator */}
              <div className="sm:hidden flex items-center px-3 py-2">
                <span className="text-sm text-muted-foreground">
                  {currentPageDisplay} / {totalPages}
                </span>
              </div>

              {/* Next button */}
              <PaginationItem>
                <PaginationNext 
                  onClick={() => handlePageClick(currentPageDisplay + 1)}
                  className={cn(
                    "cursor-pointer",
                    currentPageDisplay === totalPages && "opacity-50 cursor-not-allowed"
                  )}
                  aria-label="다음 페이지로 이동"
                  title="다음 페이지로 이동 (→ 키)"
                />
              </PaginationItem>

              {/* Last page button */}
              {showFirstLast && (
                <PaginationItem>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handlePageClick(totalPages)}
                    disabled={currentPageDisplay === totalPages}
                    className="h-9 w-9"
                    aria-label="마지막 페이지로 이동"
                    title="마지막 페이지로 이동 (End 키)"
                  >
                    <ChevronLast className="h-4 w-4" />
                  </Button>
                </PaginationItem>
              )}
            </PaginationContent>
          </Pagination>
        )}

        {/* Quick jumper */}
        {showQuickJumper && totalPages > 1 && (
          <div className="flex items-center gap-2">
            <Label htmlFor="jump-page" className="text-sm whitespace-nowrap">
              이동:
            </Label>
            <div className="flex items-center gap-1">
              <Input
                id="jump-page"
                type="number"
                min={1}
                max={totalPages}
                value={jumpPage}
                onChange={(e) => setJumpPage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleJumpToPage()}
                placeholder={currentPageDisplay.toString()}
                className="w-16 text-center"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleJumpToPage}
                disabled={!jumpPage || parseInt(jumpPage) === currentPageDisplay}
              >
                Go
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}