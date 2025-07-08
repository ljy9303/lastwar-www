import * as React from "react"
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"

import { cn } from "@/lib/utils"
import { ButtonProps, buttonVariants } from "@/components/ui/button"

const PaginationBase = ({ className, ...props }: React.ComponentProps<"nav">) => (
  <nav
    role="navigation"
    aria-label="pagination"
    className={cn("mx-auto flex w-full justify-center", className)}
    {...props}
  />
)
PaginationBase.displayName = "PaginationBase"

const PaginationContent = React.forwardRef<
  HTMLUListElement,
  React.ComponentProps<"ul">
>(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    className={cn("flex flex-row items-center gap-1", className)}
    {...props}
  />
))
PaginationContent.displayName = "PaginationContent"

const PaginationItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentProps<"li">
>(({ className, ...props }, ref) => (
  <li ref={ref} className={cn("", className)} {...props} />
))
PaginationItem.displayName = "PaginationItem"

type PaginationLinkProps = {
  isActive?: boolean
} & Pick<ButtonProps, "size"> &
  React.ComponentProps<"a">

const PaginationLink = ({
  className,
  isActive,
  size = "icon",
  ...props
}: PaginationLinkProps) => (
  <a
    aria-current={isActive ? "page" : undefined}
    className={cn(
      buttonVariants({
        variant: isActive ? "outline" : "ghost",
        size,
      }),
      className
    )}
    {...props}
  />
)
PaginationLink.displayName = "PaginationLink"

const PaginationPrevious = ({
  className,
  ...props
}: React.ComponentProps<typeof PaginationLink>) => (
  <PaginationLink
    aria-label="Go to previous page"
    size="default"
    className={cn("gap-1 pl-2.5", className)}
    {...props}
  >
    <ChevronLeft className="h-4 w-4" />
    <span>Previous</span>
  </PaginationLink>
)
PaginationPrevious.displayName = "PaginationPrevious"

const PaginationNext = ({
  className,
  ...props
}: React.ComponentProps<typeof PaginationLink>) => (
  <PaginationLink
    aria-label="Go to next page"
    size="default"
    className={cn("gap-1 pr-2.5", className)}
    {...props}
  >
    <span>Next</span>
    <ChevronRight className="h-4 w-4" />
  </PaginationLink>
)
PaginationNext.displayName = "PaginationNext"

const PaginationEllipsis = ({
  className,
  ...props
}: React.ComponentProps<"span">) => (
  <span
    aria-hidden
    className={cn("flex h-9 w-9 items-center justify-center", className)}
    {...props}
  >
    <MoreHorizontal className="h-4 w-4" />
    <span className="sr-only">More pages</span>
  </span>
)
PaginationEllipsis.displayName = "PaginationEllipsis"

// Complete Pagination Component
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showTotal?: boolean;
  totalElements?: number;
  pageSize?: number;
  className?: string;
}

const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  showTotal = false,
  totalElements = 0,
  pageSize = 10,
  className
}: PaginationProps) => {
  // Convert 0-based API to 1-based UI
  const currentPageDisplay = currentPage + 1;
  
  const generatePageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 7;
    
    if (totalPages <= maxVisiblePages) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show first page
      pages.push(1);
      
      let startPage = Math.max(2, currentPageDisplay - 2);
      let endPage = Math.min(totalPages - 1, currentPageDisplay + 2);
      
      // Adjust range if we're near the start or end
      if (currentPageDisplay <= 3) {
        endPage = 5;
      } else if (currentPageDisplay >= totalPages - 2) {
        startPage = totalPages - 4;
      }
      
      // Add ellipsis if needed
      if (startPage > 2) {
        pages.push('...');
      }
      
      // Add middle pages
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
      
      // Add ellipsis if needed
      if (endPage < totalPages - 1) {
        pages.push('...');
      }
      
      // Show last page
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

  const pages = generatePageNumbers();

  if (totalPages <= 1) {
    return null; // Don't show pagination for single page
  }

  return (
    <div 
      className={cn("flex flex-col gap-4", className)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="navigation"
      aria-label="페이지네이션"
    >
      {showTotal && (
        <div className="text-sm text-muted-foreground">
          총 {totalElements}개 항목 중 {(currentPage * pageSize) + 1}-{Math.min((currentPage + 1) * pageSize, totalElements)}개 표시
        </div>
      )}
      
      <PaginationBase>
        <PaginationContent>
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
        </PaginationContent>
      </PaginationBase>
    </div>
  );
};

export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
}