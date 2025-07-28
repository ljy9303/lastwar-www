/**
 * 게시판 API 서비스
 * 백엔드 게시판 API와 통신하는 클라이언트 서비스
 */

import { 
  BoardCategory, 
  BoardPost, 
  BoardComment, 
  BoardPostRequest, 
  BoardCommentRequest, 
  BoardSearchRequest,
  PagedResponse,
  LikeResponse,
  FileUploadResponse
} from '@/types/board';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

class BoardApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = `${API_BASE_URL}/api/board`;
  }

  // JWT 토큰을 포함한 헤더 생성
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('accessToken');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  // 파일 업로드용 헤더 (Content-Type 제외)
  private getAuthHeadersForFile(): HeadersInit {
    const token = localStorage.getItem('accessToken');
    return {
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  // 에러 처리 헬퍼
  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API 요청 실패: ${response.status} - ${errorText}`);
    }
    return response.json();
  }

  // === 카테고리 API ===

  // 전체 카테고리 목록 조회 (계층구조)
  async getCategories(): Promise<BoardCategory[]> {
    const response = await fetch(`${this.baseUrl}/categories`, {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse<BoardCategory[]>(response);
  }

  // 최상위 카테고리 조회
  async getRootCategories(): Promise<BoardCategory[]> {
    const response = await fetch(`${this.baseUrl}/categories/root`, {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse<BoardCategory[]>(response);
  }

  // 특정 카테고리 상세 조회
  async getCategoryById(categoryId: number): Promise<BoardCategory> {
    const response = await fetch(`${this.baseUrl}/categories/${categoryId}`, {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse<BoardCategory>(response);
  }

  // 하위 카테고리 조회
  async getSubCategories(categoryId: number): Promise<BoardCategory[]> {
    const response = await fetch(`${this.baseUrl}/categories/${categoryId}/subcategories`, {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse<BoardCategory[]>(response);
  }

  // 카테고리 검색
  async searchCategories(keyword: string): Promise<BoardCategory[]> {
    const response = await fetch(`${this.baseUrl}/categories/search?keyword=${encodeURIComponent(keyword)}`, {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse<BoardCategory[]>(response);
  }

  // === 게시글 API ===

  // 게시글 목록 조회
  async getPosts(
    categoryId?: number, 
    page: number = 1, 
    size: number = 20, 
    sortBy: string = 'latest'
  ): Promise<PagedResponse<BoardPost>> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
      sortBy
    });
    
    if (categoryId) {
      params.append('categoryId', categoryId.toString());
    }

    const response = await fetch(`${this.baseUrl}/posts?${params}`, {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse<PagedResponse<BoardPost>>(response);
  }

  // 게시글 상세 조회
  async getPostDetail(postId: number): Promise<BoardPost> {
    const response = await fetch(`${this.baseUrl}/posts/${postId}`, {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse<BoardPost>(response);
  }

  // 게시글 작성
  async createPost(request: BoardPostRequest): Promise<BoardPost> {
    const response = await fetch(`${this.baseUrl}/posts`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(request)
    });
    return this.handleResponse<BoardPost>(response);
  }

  // 게시글 수정
  async updatePost(postId: number, request: BoardPostRequest): Promise<BoardPost> {
    const response = await fetch(`${this.baseUrl}/posts/${postId}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(request)
    });
    return this.handleResponse<BoardPost>(response);
  }

  // 게시글 삭제
  async deletePost(postId: number): Promise<void> {
    const response = await fetch(`${this.baseUrl}/posts/${postId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`게시글 삭제 실패: ${response.status} - ${errorText}`);
    }
  }

  // 게시글 좋아요/취소
  async togglePostLike(postId: number): Promise<LikeResponse> {
    const response = await fetch(`${this.baseUrl}/posts/${postId}/like`, {
      method: 'POST',
      headers: this.getAuthHeaders()
    });
    return this.handleResponse<LikeResponse>(response);
  }

  // 게시글 검색
  async searchPosts(searchRequest: BoardSearchRequest): Promise<PagedResponse<BoardPost>> {
    const params = new URLSearchParams({
      keyword: searchRequest.keyword,
      searchType: searchRequest.searchType,
      sortBy: searchRequest.sortBy,
      page: searchRequest.page.toString(),
      size: searchRequest.size.toString()
    });

    if (searchRequest.categoryId) {
      params.append('categoryId', searchRequest.categoryId.toString());
    }

    const response = await fetch(`${this.baseUrl}/posts/search?${params}`, {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse<PagedResponse<BoardPost>>(response);
  }

  // 인기 게시글 조회
  async getPopularPosts(period: string = 'week', limit: number = 10): Promise<BoardPost[]> {
    const params = new URLSearchParams({
      period,
      limit: limit.toString()
    });

    const response = await fetch(`${this.baseUrl}/posts/popular?${params}`, {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse<BoardPost[]>(response);
  }

  // 고정 게시글 조회
  async getPinnedPosts(): Promise<BoardPost[]> {
    const response = await fetch(`${this.baseUrl}/posts/pinned`, {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse<BoardPost[]>(response);
  }

  // 최신 게시글 조회
  async getRecentPosts(limit: number = 10): Promise<BoardPost[]> {
    const response = await fetch(`${this.baseUrl}/posts/recent?limit=${limit}`, {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse<BoardPost[]>(response);
  }

  // 내가 쓴 글 조회
  async getMyPosts(page: number = 1, size: number = 20): Promise<PagedResponse<BoardPost>> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString()
    });

    const response = await fetch(`${this.baseUrl}/posts/my-posts?${params}`, {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse<PagedResponse<BoardPost>>(response);
  }

  // 내가 좋아요한 글 조회
  async getLikedPosts(page: number = 1, size: number = 20): Promise<PagedResponse<BoardPost>> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString()
    });

    const response = await fetch(`${this.baseUrl}/posts/liked-posts?${params}`, {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse<PagedResponse<BoardPost>>(response);
  }

  // === 댓글 API ===

  // 게시글의 댓글 목록 조회 (페이징)
  async getCommentsByPost(postId: number, page: number = 1, size: number = 20): Promise<PagedResponse<BoardComment>> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString()
    });

    const response = await fetch(`${this.baseUrl}/comments/post/${postId}?${params}`, {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse<PagedResponse<BoardComment>>(response);
  }

  // 게시글의 모든 댓글 조회 (계층구조)
  async getAllCommentsByPost(postId: number): Promise<BoardComment[]> {
    const response = await fetch(`${this.baseUrl}/comments/post/${postId}/all`, {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse<BoardComment[]>(response);
  }

  // 댓글 작성
  async createComment(request: BoardCommentRequest): Promise<BoardComment> {
    const response = await fetch(`${this.baseUrl}/comments`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(request)
    });
    return this.handleResponse<BoardComment>(response);
  }

  // 댓글 수정
  async updateComment(commentId: number, request: BoardCommentRequest): Promise<BoardComment> {
    const response = await fetch(`${this.baseUrl}/comments/${commentId}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(request)
    });
    return this.handleResponse<BoardComment>(response);
  }

  // 댓글 삭제
  async deleteComment(commentId: number): Promise<void> {
    const response = await fetch(`${this.baseUrl}/comments/${commentId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`댓글 삭제 실패: ${response.status} - ${errorText}`);
    }
  }

  // 댓글 좋아요/취소
  async toggleCommentLike(commentId: number): Promise<LikeResponse> {
    const response = await fetch(`${this.baseUrl}/comments/${commentId}/like`, {
      method: 'POST',
      headers: this.getAuthHeaders()
    });
    return this.handleResponse<LikeResponse>(response);
  }

  // 사용자별 댓글 조회
  async getCommentsByUser(userId: number, page: number = 1, size: number = 20): Promise<PagedResponse<BoardComment>> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString()
    });

    const response = await fetch(`${this.baseUrl}/comments/user/${userId}?${params}`, {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse<PagedResponse<BoardComment>>(response);
  }

  // 내 댓글 목록 조회
  async getMyComments(page: number = 1, size: number = 20): Promise<PagedResponse<BoardComment>> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString()
    });

    const response = await fetch(`${this.baseUrl}/comments/my-comments?${params}`, {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse<PagedResponse<BoardComment>>(response);
  }

  // 최근 댓글 조회
  async getRecentComments(limit: number = 10): Promise<BoardComment[]> {
    const response = await fetch(`${this.baseUrl}/comments/recent?limit=${limit}`, {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse<BoardComment[]>(response);
  }

  // 댓글 상세 조회
  async getCommentDetail(commentId: number): Promise<BoardComment> {
    const response = await fetch(`${this.baseUrl}/comments/${commentId}`, {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse<BoardComment>(response);
  }

  // === 파일 업로드 API ===

  // 이미지 파일 업로드
  async uploadImage(file: File): Promise<FileUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${this.baseUrl}/upload/image`, {
      method: 'POST',
      headers: this.getAuthHeadersForFile(),
      body: formData
    });
    return this.handleResponse<FileUploadResponse>(response);
  }

  // 첨부파일 업로드
  async uploadAttachment(file: File): Promise<FileUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${this.baseUrl}/upload/attachment`, {
      method: 'POST',
      headers: this.getAuthHeadersForFile(),
      body: formData
    });
    return this.handleResponse<FileUploadResponse>(response);
  }
}

export const boardApi = new BoardApiService();