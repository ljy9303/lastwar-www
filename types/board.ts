/**
 * 게시판 관련 TypeScript 타입 정의
 */

// 기본 응답 타입
export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  hasNext: boolean;
  hasPrevious: boolean;
  isFirst: boolean;
  isLast: boolean;
}

export interface PagedResponse<T> {
  content: T[];
  pagination: PaginationInfo;
}

// 카테고리 관련 타입
export interface BoardCategory {
  categoryId: number;
  parentCategoryId?: number;
  categoryName: string;
  categoryDescription?: string;
  sortOrder: number;
  depth: number;
  isActive: boolean;
  subcategories?: BoardCategory[];
  postCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface BoardCategoryResponse extends BoardCategory {}

// 게시글 관련 타입
export interface BoardPost {
  postId: number;
  categoryId: number;
  categoryName?: string;
  userId: number;
  authorName: string;
  authorProfileImageUrl?: string;
  authorUserLabel?: string;
  title: string;
  content?: string;
  contentPreview?: string;
  thumbnailUrl?: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  isPinned: boolean;
  isLiked: boolean;
  postStatus: string;
  attachments?: BoardPostAttachment[];
  createdAt: string;
  updatedAt: string;
}

export interface BoardPostResponse extends BoardPost {}

export interface BoardPostAttachment {
  attachmentId: number;
  postId: number;
  imageUrl: string;
  imageKey: string;
  originalFilename: string;
  fileSize: number;
  formattedFileSize: string;
  mimeType: string;
  isThumbnail: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface BoardPostAttachmentResponse extends BoardPostAttachment {}

// 댓글 관련 타입
export interface BoardComment {
  commentId: number;
  postId: number;
  userId: number;
  authorName: string;
  authorProfileImageUrl?: string;
  authorUserLabel?: string;
  parentCommentId?: number;
  content: string;
  likeCount: number;
  isLiked: boolean;
  commentStatus: string;
  replies?: BoardComment[];
  createdAt: string;
  updatedAt: string;
}

export interface BoardCommentResponse extends BoardComment {}

// 요청 타입들
export interface BoardPostRequest {
  categoryId: number;
  title: string;
  content: string;
  thumbnailUrl?: string;
  attachments: AttachmentRequest[];
  contentImages: ContentImageRequest[];
}

export interface AttachmentRequest {
  imageUrl: string;
  imageKey: string;
  originalFilename: string;
  fileSize: number;
  mimeType: string;
  isThumbnail: boolean;
  sortOrder: number;
}

export interface ContentImageRequest {
  imageUrl: string;
  imageKey: string;
}

export interface BoardCommentRequest {
  postId: number;
  parentCommentId?: number;
  content: string;
  contentImages: ContentImageRequest[];
}

export interface BoardSearchRequest {
  keyword: string;
  categoryId?: number;
  searchType: 'all' | 'title' | 'content' | 'author';
  sortBy: 'latest' | 'popular' | 'views' | 'likes';
  page: number;
  size: number;
}

// UI 상태 타입들
export interface BoardState {
  categories: BoardCategory[];
  posts: BoardPost[];
  currentPost?: BoardPost;
  comments: BoardComment[];
  isLoading: boolean;
  error?: string;
}

export interface BoardFilters {
  categoryId?: number;
  searchKeyword?: string;
  sortBy: 'latest' | 'popular' | 'views' | 'comments';
  page: number;
  size: number;
}

// 좋아요 응답 타입
export interface LikeResponse {
  isLiked: boolean;
  message: string;
}

// 파일 업로드 관련 타입
export interface FileUploadResponse {
  imageUrl: string;
  imageKey: string;
  originalFilename: string;
  fileSize: number;
  mimeType: string;
}

// 에러 타입
export interface BoardError {
  message: string;
  code?: string;
  details?: any;
}