'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TouchButton } from '@/components/ui/touch-button';
import { Textarea } from '@/components/ui/textarea';
import { useMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { 
  Heart, 
  MessageCircle, 
  Edit, 
  Trash2,
  Reply,
  Send,
  User
} from 'lucide-react';
import { boardApi } from '@/lib/board-api';
import { BoardComment, BoardCommentRequest } from '@/types/board';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

interface BoardCommentListProps {
  postId: number;
  currentUserId?: number;
  postAuthorId?: number; // 게시글 작성자 ID 추가
  comments: BoardComment[];
  isLoading: boolean;
  onCommentsUpdate: (action?: 'add' | 'delete') => void;
}

interface CommentItemProps {
  comment: BoardComment;
  currentUserId?: number;
  postAuthorId?: number; // 게시글 작성자 ID 추가
  onReply: (parentId: number) => void;
  onEdit: (comment: BoardComment) => void;
  onDelete: (commentId: number) => void;
  onLike: (commentId: number) => void;
  isReply?: boolean;  // 대댓글 여부
  commentLikeUIStates: Record<number, { isLiked: boolean; pendingChange: number }>;
  // 답글/수정 상태 전달
  replyingTo: number | null;
  editingComment: BoardComment | null;
  replyContent: string;
  editContent: string;
  isSubmitting: boolean;
  onReplyContentChange: (content: string) => void;
  onEditContentChange: (content: string) => void;
  onSubmitReply: () => void;
  onUpdateComment: () => void;
  onCancelReply: () => void;
  onCancelEdit: () => void;
}

// 개별 댓글 컴포넌트
function CommentItem({ 
  comment, 
  currentUserId, 
  postAuthorId,
  onReply, 
  onEdit, 
  onDelete, 
  onLike,
  isReply = false,
  commentLikeUIStates,
  replyingTo,
  editingComment,
  replyContent,
  editContent,
  isSubmitting,
  onReplyContentChange,
  onEditContentChange,
  onSubmitReply,
  onUpdateComment,
  onCancelReply,
  onCancelEdit
}: CommentItemProps) {
  const isMobile = useMobile();
  const isAuthor = currentUserId === comment.userId;
  const isPostAuthor = postAuthorId === comment.userId; // 게시글 작성자 여부
  const isDeleted = comment.commentStatus === 'DELETED';
  
  // UI 상태 가져오기 (없으면 실제 데이터 기준)
  const uiState = commentLikeUIStates[comment.commentId] || { isLiked: comment.isLiked, pendingChange: 0 };

  // 대댓글인 경우 들여쓰기 적용 (모바일에서는 줄임)
  const marginLeft = isReply ? (isMobile ? 24 : 48) : 0;
  const showBorder = isReply;

  return (
    <div 
      className={cn(
        "transition-colors hover:bg-gray-50",
        isMobile ? "px-4 py-4" : "px-6 py-5",
        showBorder && "border-l-2 border-gray-200 bg-gray-50"
      )}
      style={{ marginLeft: `${marginLeft}px` }}
    >
      <div className="flex gap-4">
        {/* 프로필 */}
        <Avatar className="w-10 h-10 shrink-0">
          <AvatarImage src={comment.authorProfileImageUrl} />
          <AvatarFallback className="bg-blue-100 text-blue-700">
            <User className="h-5 w-5" />
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          {/* 작성자 정보 */}
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center gap-2">
              {comment.serverNumber && comment.allianceTag && (
                <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                  {comment.serverNumber}서버 [{comment.allianceTag}]
                </Badge>
              )}
              <span className="font-semibold text-gray-900">{comment.authorName}</span>
              {isPostAuthor && (
                <Badge className="text-xs bg-green-500 text-white">
                  작성자
                </Badge>
              )}
            </div>
            <span className="text-sm text-gray-500">
              {formatDistanceToNow(new Date(comment.createdAt), { 
                addSuffix: true, 
                locale: ko 
              })}
            </span>
          </div>

          {/* 댓글 내용 */}
          <div className="mb-4">
            <p className={`whitespace-pre-wrap leading-relaxed ${
              isDeleted ? 'text-gray-500 italic' : 'text-gray-800'
            }`}>
              {comment.content}
            </p>
          </div>

          {/* 액션 버튼들 - 삭제된 댓글에도 표시 */}
          <div className="flex items-center gap-6 text-sm">
            <button
              onClick={() => onLike(comment.commentId)}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-md transition-all ${
                uiState.isLiked 
                  ? 'text-red-600 bg-red-50 hover:bg-red-100' 
                  : 'text-gray-500 hover:text-red-600 hover:bg-red-50'
              }`}
            >
              <Heart className={`h-4 w-4 ${uiState.isLiked ? 'fill-current' : ''}`} />
              <span className="font-medium">
                {(comment.likeCount + uiState.pendingChange) > 0 ? (comment.likeCount + uiState.pendingChange) : '좋아요'}
              </span>
            </button>

            {currentUserId && !isReply && (
              <button
                onClick={() => onReply(comment.commentId)}
                className="flex items-center gap-1.5 px-2 py-1 rounded-md text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-all"
              >
                <Reply className="h-4 w-4" />
                <span className="font-medium">답글</span>
              </button>
            )}

            {isAuthor && (
              <div className="flex items-center gap-3">
                {!isDeleted ? (
                  <>
                    <button
                      onClick={() => onEdit(comment)}
                      className="flex items-center gap-1.5 px-2 py-1 rounded-md text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-all"
                    >
                      <Edit className="h-4 w-4" />
                      <span className="font-medium">수정</span>
                    </button>
                    <button
                      onClick={() => onDelete(comment.commentId)}
                      className="flex items-center gap-1.5 px-2 py-1 rounded-md text-gray-500 hover:text-red-600 hover:bg-red-50 transition-all"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="font-medium">삭제</span>
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => onEdit(comment)} // 원복 기능으로 활용
                    className="flex items-center gap-1.5 px-2 py-1 rounded-md text-gray-500 hover:text-green-600 hover:bg-green-50 transition-all"
                  >
                    <Edit className="h-4 w-4" />
                    <span className="font-medium">원복</span>
                  </button>
                )}
              </div>
            )}
          </div>


          {/* 댓글 수정/원복 폼 */}
          {editingComment?.commentId === comment.commentId && (
            <div className={`mt-4 px-6 py-4 border-l-2 ${
              editingComment.commentStatus === 'DELETED' 
                ? 'bg-green-50 border-green-200' 
                : 'bg-yellow-50 border-yellow-200'
            }`} style={{ marginLeft: isReply ? '48px' : '0px' }}>
              <div className="space-y-4">
                <Textarea
                  placeholder={editingComment.commentStatus === 'DELETED' 
                    ? "댓글을 원복할 새로운 내용을 입력하세요..." 
                    : "댓글 수정..."}
                  value={editContent}
                  onChange={(e) => onEditContentChange(e.target.value)}
                  className={`min-h-[80px] bg-white border-gray-200 focus:ring-2 focus:border-transparent ${
                    editingComment.commentStatus === 'DELETED' 
                      ? 'focus:ring-green-500' 
                      : 'focus:ring-yellow-500'
                  }`}
                />
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onCancelEdit}
                  >
                    취소
                  </Button>
                  <Button
                    size="sm"
                    onClick={onUpdateComment}
                    disabled={!editContent.trim() || isSubmitting}
                    className={editingComment.commentStatus === 'DELETED' 
                      ? "bg-green-600 hover:bg-green-700 text-white" 
                      : "bg-yellow-600 hover:bg-yellow-700 text-white"}
                  >
                    {editingComment.commentStatus === 'DELETED' ? '원복 완료' : '수정 완료'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function BoardCommentList({ 
  postId, 
  currentUserId, 
  postAuthorId,
  comments, 
  isLoading, 
  onCommentsUpdate 
}: BoardCommentListProps) {
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isMobile = useMobile();
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [editingComment, setEditingComment] = useState<BoardComment | null>(null);
  const [editContent, setEditContent] = useState('');
  const [localComments, setLocalComments] = useState<BoardComment[]>(comments);
  
  // 댓글 좋아요 UI 상태 관리 (commentId -> {isLiked, pendingChange})
  const [commentLikeUIStates, setCommentLikeUIStates] = useState<Record<number, { isLiked: boolean; pendingChange: number }>>({});

  // 답글 입력창 ref
  const replyTextareaRef = React.useRef<HTMLTextAreaElement>(null);

  // comments prop이 변경될 때 localComments 동기화
  React.useEffect(() => {
    setLocalComments(comments);
  }, [comments]);

  // 총 댓글 개수 계산 (대댓글 포함)
  const getTotalCommentCount = (comments: BoardComment[]): number => {
    return comments.reduce((total, comment) => {
      let count = 1; // 현재 댓글 1개
      if (comment.replies && comment.replies.length > 0) {
        count += getTotalCommentCount(comment.replies); // 대댓글 재귀 계산
      }
      return total + count;
    }, 0);
  };

  // 새 댓글 작성
  const handleSubmitComment = async () => {
    if (!newComment.trim() || !currentUserId) return;

    try {
      setIsSubmitting(true);
      
      const request: BoardCommentRequest = {
        postId,
        content: newComment,
        contentImages: []
      };

      await boardApi.createComment(request);
      setNewComment('');
      onCommentsUpdate('add');
    } catch (err) {
      console.error('댓글 작성 실패:', err);
      alert('댓글 작성에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 답글 작성
  const handleSubmitReply = async () => {
    if (!replyContent.trim() || !currentUserId || !replyingTo) return;

    try {
      setIsSubmitting(true);
      
      const request: BoardCommentRequest = {
        postId,
        parentCommentId: replyingTo,
        content: replyContent,
        contentImages: []
      };

      await boardApi.createComment(request);
      setReplyContent('');
      setReplyingTo(null);
      onCommentsUpdate('add');
      
      // 댓글 작성 완료 후 스크롤을 맨 위로 부드럽게 이동
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
    } catch (err) {
      console.error('답글 작성 실패:', err);
      alert('답글 작성에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 댓글 수정/원복
  const handleUpdateComment = async () => {
    if (!editContent.trim() || !editingComment) return;

    try {
      setIsSubmitting(true);
      
      const isDeleted = editingComment.commentStatus === 'DELETED';
      
      if (isDeleted) {
        // 삭제된 댓글 원복
        await boardApi.restoreComment(editingComment.commentId, editContent);
      } else {
        // 일반 댓글 수정
        const request: BoardCommentRequest = {
          postId,
          content: editContent,
          contentImages: []
        };
        await boardApi.updateComment(editingComment.commentId, request);
      }
      
      setEditingComment(null);
      setEditContent('');
      onCommentsUpdate();
    } catch (err) {
      console.error('댓글 수정/원복 실패:', err);
      const action = editingComment.commentStatus === 'DELETED' ? '원복' : '수정';
      alert(`댓글 ${action}에 실패했습니다.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 댓글 삭제
  const handleDeleteComment = async (commentId: number) => {
    if (!confirm('정말로 이 댓글을 삭제하시겠습니까?')) return;

    try {
      await boardApi.deleteComment(commentId);
      onCommentsUpdate('delete');
    } catch (err) {
      console.error('댓글 삭제 실패:', err);
      alert('댓글 삭제에 실패했습니다.');
    }
  };

  // 댓글 좋아요 - UI +1 방식
  const handleCommentLike = async (commentId: number) => {
    // 현재 댓글 찾기 (재귀적으로 찾기)
    const findComment = (comments: BoardComment[], id: number): BoardComment | null => {
      for (const comment of comments) {
        if (comment.commentId === id) return comment;
        if (comment.replies) {
          const found = findComment(comment.replies, id);
          if (found) return found;
        }
      }
      return null;
    };

    const currentComment = findComment(localComments, commentId);
    if (!currentComment) return;

    // 현재 UI 상태 가져오기 (없으면 실제 데이터 기준으로 초기화)
    const currentUIState = commentLikeUIStates[commentId] || { isLiked: currentComment.isLiked, pendingChange: 0 };
    
    // 즉각적인 UI 반응
    const newIsLiked = !currentUIState.isLiked;
    const pendingChange = newIsLiked 
      ? (currentComment.isLiked ? 0 : 1)  // 좋아요 추가: 원래 좋아요면 변화없음, 아니면 +1
      : (currentComment.isLiked ? -1 : 0); // 좋아요 취소: 원래 좋아요면 -1, 아니면 변화없음

    setCommentLikeUIStates(prev => ({
      ...prev,
      [commentId]: {
        isLiked: newIsLiked,
        pendingChange: pendingChange
      }
    }));

    try {
      // 백엔드 API 호출
      await boardApi.toggleCommentLike(commentId);
    } catch (err) {
      console.error('댓글 좋아요 실패:', err);
      // 에러 시 원래 상태로 롤백
      setCommentLikeUIStates(prev => ({
        ...prev,
        [commentId]: {
          isLiked: currentComment.isLiked,
          pendingChange: 0
        }
      }));
    }
  };

  // 답글 시작 - 항상 최상위 댓글에 대한 대댓글로 작성
  const handleStartReply = (parentId: number) => {
    // 댓글을 찾아서 최상위 댓글 ID를 구하기
    const findRootCommentId = (comments: BoardComment[], targetId: number): number => {
      for (const comment of comments) {
        if (comment.commentId === targetId) {
          // 이미 최상위 댓글이면 그대로 반환
          return comment.commentId;
        }
        if (comment.replies) {
          for (const reply of comment.replies) {
            if (reply.commentId === targetId) {
              // 대댓글이면 부모 댓글 ID 반환
              return comment.commentId;
            }
          }
        }
      }
      return targetId; // 찾지 못하면 원본 ID 반환
    };
    
    const rootCommentId = findRootCommentId(localComments, parentId);
    setReplyingTo(rootCommentId);
    setEditingComment(null);
    
    // 다음 렌더링 후 포커스 및 스크롤
    setTimeout(() => {
      if (replyTextareaRef.current) {
        replyTextareaRef.current.focus();
        replyTextareaRef.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }
    }, 100);
  };

  // 수정/원복 시작
  const handleStartEdit = (comment: BoardComment) => {
    setEditingComment(comment);
    // 삭제된 댓글의 경우 빈 내용으로 시작 (새로운 내용을 입력하도록)
    const isDeleted = comment.commentStatus === 'DELETED';
    setEditContent(isDeleted ? '' : comment.content);
    setReplyingTo(null);
  };

  // 답글 취소
  const handleCancelReply = () => {
    setReplyingTo(null);
    setReplyContent('');
  };

  // 수정 취소
  const handleCancelEdit = () => {
    setEditingComment(null);
    setEditContent('');
  };

  return (
    <Card>
      {/* 댓글 헤더 */}
      <CardHeader className="pb-4 border-b">
        <CardTitle className="flex items-center gap-2 text-xl text-gray-900">
          <MessageCircle className="h-5 w-5" />
          댓글 {getTotalCommentCount(localComments)}개
        </CardTitle>
      </CardHeader>

      <CardContent className="p-0">
        {/* 새 댓글 작성 */}
        {currentUserId && (
          <div className={cn(
            "border-b bg-gray-50",
            isMobile ? "p-4" : "p-6"
          )}>
            <div className="space-y-4">
              <Textarea
                placeholder={isMobile ? "댓글 작성..." : "댓글을 작성해주세요..."}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className={cn(
                  "bg-white border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                  isMobile ? "min-h-[80px] mobile-input" : "min-h-[100px]"
                )}
              />
              <div className="flex justify-end">
                <TouchButton 
                  onClick={handleSubmitComment}
                  disabled={!newComment.trim() || isSubmitting}
                  loading={isSubmitting}
                  className={cn(
                    "bg-blue-600 hover:bg-blue-700 text-white font-medium",
                    isMobile ? "px-4 py-2 text-sm" : "px-6 py-2"
                  )}
                  ariaLabel="댓글 작성"
                  hapticFeedback
                >
                  <Send className="h-4 w-4 mr-2" />
                  {isMobile ? "작성" : "댓글 작성"}
                </TouchButton>
              </div>
            </div>
          </div>
        )}
        {/* 댓글 목록 */}
        {isLoading ? (
          <div className="space-y-6 p-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="flex-1 space-y-3">
                  <div className="flex gap-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <div className="flex gap-4">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-12" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : localComments.length === 0 ? (
          <div className="p-12">
            <EmptyState
              title="댓글이 없습니다"
              description="첫 번째 댓글을 작성해보세요!"
            />
          </div>
        ) : (
          <div>
            {localComments.map((comment, index) => (
              <div key={comment.commentId}>
                {/* 최상위 댓글 */}
                <CommentItem
                  comment={comment}
                  currentUserId={currentUserId}
                  postAuthorId={postAuthorId}
                  onReply={handleStartReply}
                  onEdit={handleStartEdit}
                  onDelete={handleDeleteComment}
                  onLike={handleCommentLike}
                  isReply={false}
                  commentLikeUIStates={commentLikeUIStates}
                  replyingTo={replyingTo}
                  editingComment={editingComment}
                  replyContent={replyContent}
                  editContent={editContent}
                  isSubmitting={isSubmitting}
                  onReplyContentChange={setReplyContent}
                  onEditContentChange={setEditContent}
                  onSubmitReply={handleSubmitReply}
                  onUpdateComment={handleUpdateComment}
                  onCancelReply={handleCancelReply}
                  onCancelEdit={handleCancelEdit}
                />

                {/* 대댓글 목록 */}
                {comment.replies && comment.replies.length > 0 && (
                  <div className="space-y-0">
                    {comment.replies.map((reply) => (
                      <CommentItem
                        key={reply.commentId}
                        comment={reply}
                        currentUserId={currentUserId}
                        postAuthorId={postAuthorId}
                        onReply={handleStartReply}
                        onEdit={handleStartEdit}
                        onDelete={handleDeleteComment}
                        onLike={handleCommentLike}
                        isReply={true}
                        commentLikeUIStates={commentLikeUIStates}
                        replyingTo={replyingTo}
                        editingComment={editingComment}
                        replyContent={replyContent}
                        editContent={editContent}
                        isSubmitting={isSubmitting}
                        onReplyContentChange={setReplyContent}
                        onEditContentChange={setEditContent}
                        onSubmitReply={handleSubmitReply}
                        onUpdateComment={handleUpdateComment}
                        onCancelReply={handleCancelReply}
                        onCancelEdit={handleCancelEdit}
                      />
                    ))}
                  </div>
                )}

                {/* 답글 작성 폼 - 대댓글 목록 하단에 표시 */}
                {replyingTo === comment.commentId && (
                  <div className="mt-4 px-6 py-4 border-l-2 border-blue-200 bg-blue-50" style={{ marginLeft: '48px' }}>
                    <div className="space-y-4">
                      <Textarea
                        ref={replyTextareaRef}
                        placeholder={`${comment.authorName}님에게 답글 작성...`}
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        className="min-h-[80px] bg-white border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleCancelReply}
                        >
                          취소
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleSubmitReply}
                          disabled={!replyContent.trim() || isSubmitting}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          답글 작성
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {index < localComments.length - 1 && (
                  <div className="border-b border-gray-100" />
                )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
  );
}