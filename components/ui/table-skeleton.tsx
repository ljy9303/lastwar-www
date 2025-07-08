import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  showHeader?: boolean;
}

export function TableSkeleton({ 
  rows = 5, 
  columns = 6, 
  showHeader = true 
}: TableSkeletonProps) {
  return (
    <div className="rounded-md border">
      <Table>
        {showHeader && (
          <TableHeader>
            <TableRow>
              {Array.from({ length: columns }).map((_, index) => (
                <TableHead key={index}>
                  <Skeleton className="h-4 w-16" />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
        )}
        <TableBody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <TableRow key={rowIndex}>
              {Array.from({ length: columns }).map((_, colIndex) => (
                <TableCell key={colIndex}>
                  {colIndex === 0 ? (
                    // First column (typically title/name) - wider skeleton
                    <div>
                      <Skeleton className="h-4 w-32 mb-1" />
                      <Skeleton className="h-3 w-24 md:hidden" />
                    </div>
                  ) : colIndex === columns - 1 ? (
                    // Last column (typically actions) - button skeletons
                    <div className="flex justify-end gap-1">
                      <Skeleton className="h-8 w-16" />
                      <Skeleton className="h-8 w-16" />
                      <Skeleton className="h-8 w-16" />
                    </div>
                  ) : (
                    // Other columns - various width skeletons
                    <Skeleton className={`h-4 ${
                      colIndex === 1 ? 'w-20' : 
                      colIndex === 2 ? 'w-8' : 
                      'w-12'
                    }`} />
                  )}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}