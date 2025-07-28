'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
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
  comments: BoardComment[];
  isLoading: boolean;
  onCommentsUpdate: () => void;
}

interface CommentItemProps {
  comment: BoardComment;
  currentUserId?: number;
  onReply: (parentId: number) => void;
  onEdit: (comment: BoardComment) => void;
  onDelete: (commentId: number) => void;
  onLike: (commentId: number) => void;
  isReply?: boolean;
}

// 개별 댓글 컴포넌트
function CommentItem({ 
  comment, 
  currentUserId, 
  onReply, 
  onEdit, 
  onDelete, 
  onLike,
  isReply = false 
}: CommentItemProps) {
  const isAuthor = currentUserId === comment.userId;
  const isDeleted = comment.commentStatus === 'DELETED';

  if (isDeleted) {
    return (
      <div className={`p-4 ${isReply ? 'ml-8 border-l-2 border-gray-200' : ''}`}>
        <div className="text-gray-500 italic">삭제된 댓글입니다.</div>
      </div>
    );
  }

  return (
    <div className={`p-4 ${isReply ? 'ml-8 border-l-2 border-gray-200' : ''}`}>
      <div className="flex gap-3">
        {/* 프로필 */}
        <Avatar className="w-8 h-8">
          <AvatarImage src={comment.authorProfileImageUrl} />
          <AvatarFallback>
            <User className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>

        <div className="flex-1">
          {/* 작성자 정보 */}
          <div className="flex items-center gap-2 mb-2">
            <span className="font-medium">{comment.authorName}</span>
            {comment.authorUserLabel && (
              <Badge variant="outline" className="text-xs">
                {comment.authorUserLabel}
              </Badge>
            )}
            <span className="text-sm text-gray-500">
              {formatDistanceToNow(new Date(comment.createdAt), { 
                addSuffix: true, 
                locale: ko 
              })}
            </span>
          </div>

          {/* 댓글 내용 */}
          <div className="mb-3">
            <p className="whitespace-pre-wrap">{comment.content}</p>
          </div>

          {/* 액션 버튼들 */}
          <div className="flex items-center gap-4 text-sm">
            <button
              onClick={() => onLike(comment.commentId)}
              className={`flex items-center gap-1 hover:text-red-500 transition-colors ${
                comment.isLiked ? 'text-red-500' : 'text-gray-500'
              }`}
            >
              <Heart className={`h-4 w-4 ${comment.isLiked ? 'fill-current' : ''}`} />
              좋아요 {comment.likeCount}
            </button>

            {!isReply && currentUserId && (
              <button
                onClick={() => onReply(comment.commentId)}
                className="flex items-center gap-1 text-gray-500 hover:text-blue-500 transition-colors"
              >
                <Reply className="h-4 w-4" />
                답글
              </button>
            )}

            {isAuthor && (
              <>
                <button
                  onClick={() => onEdit(comment)}
                  className="flex items-center gap-1 text-gray-500 hover:text-blue-500 transition-colors"
                >
                  <Edit className="h-4 w-4" />
                  수정
                </button>
                <button
                  onClick={() => onDelete(comment.commentId)}
                  className="flex items-center gap-1 text-gray-500 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                  삭제
                </button>
              </>
            )}
          </div>

          {/* 답글 목록 */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-4 space-y-3">
              {comment.replies.map(reply => (
                <CommentItem
                  key={reply.commentId}
                  comment={reply}
                  currentUserId={currentUserId}
                  onReply={onReply}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onLike={onLike}
                  isReply
                />
              ))}
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
  comments, 
  isLoading, 
  onCommentsUpdate 
}: BoardCommentListProps) {
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [editingComment, setEditingComment] = useState<BoardComment | null>(null);
  const [editContent, setEditContent] = useState('');

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
      onCommentsUpdate();
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
      onCommentsUpdate();
    } catch (err) {
      console.error('답글 작성 실패:', err);
      alert('답글 작성에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 댓글 수정
  const handleUpdateComment = async () => {
    if (!editContent.trim() || !editingComment) return;

    try {
      setIsSubmitting(true);
      
      const request: BoardCommentRequest = {
        postId,
        content: editContent,
        contentImages: []
      };

      await boardApi.updateComment(editingComment.commentId, request);
      setEditingComment(null);
      setEditContent('');
      onCommentsUpdate();
    } catch (err) {
      console.error('댓글 수정 실패:', err);
      alert('댓글 수정에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 댓글 삭제
  const handleDeleteComment = async (commentId: number) => {
    if (!confirm('정말로 이 댓글을 삭제하시겠습니까?')) return;

    try {
      await boardApi.deleteComment(commentId);
      onCommentsUpdate();
    } catch (err) {
      console.error('댓글 삭제 실패:', err);
      alert('댓글 삭제에 실패했습니다.');
    }
  };

  // 댓글 좋아요
  const handleCommentLike = async (commentId: number) => {
    try {
      await boardApi.toggleCommentLike(commentId);
      onCommentsUpdate();
    } catch (err) {
      console.error('댓글 좋아요 실패:', err);
    }
  };

  // 답글 시작
  const handleStartReply = (parentId: number) => {
    setReplyingTo(parentId);
    setEditingComment(null);
  };

  // 수정 시작
  const handleStartEdit = (comment: BoardComment) => {
    setEditingComment(comment);
    setEditContent(comment.content);
    setReplyingTo(null);
  };

  return (
    <div>
      {/* 댓글 헤더 */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            댓글 {comments.length}개
          </CardTitle>
        </CardHeader>
      </Card>

      {/* 새 댓글 작성 */}
      {currentUserId && (
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="space-y-3">
              <Textarea
                placeholder="댓글을 작성해주세요..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="min-h-[100px]"
              />
              <div className="flex justify-end">
                <Button 
                  onClick={handleSubmitComment}
                  disabled={!newComment.trim() || isSubmitting}
                >
                  <Send className="h-4 w-4 mr-2" />
                  댓글 작성
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 댓글 목록 */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-4 p-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="w-8 h-8 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="flex gap-2">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <div className="flex gap-4">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-12" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : comments.length === 0 ? (
            <div className="p-8">
              <EmptyState
                title="댓글이 없습니다"
                description="첫 번째 댓글을 작성해보세요!"
              />
            </div>
          ) : (
            <div>
              {comments.map((comment, index) => (
                <div key={comment.commentId}>
                  <CommentItem
                    comment={comment}
                    currentUserId={currentUserId}
                    onReply={handleStartReply}
                    onEdit={handleStartEdit}
                    onDelete={handleDeleteComment}
                    onLike={handleCommentLike}
                  />

                  {/* 답글 작성 폼 */}
                  {replyingTo === comment.commentId && (
                    <div className="p-4 ml-8 border-l-2 border-gray-200 bg-gray-50">
                      <div className="space-y-3">
                        <Textarea
                          placeholder={`${comment.authorName}님에게 답글 작성...`}
                          value={replyContent}
                          onChange={(e) => setReplyContent(e.target.value)}
                          className="min-h-[80px]"
                        />
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setReplyingTo(null)}
                          >
                            취소
                          </Button>
                          <Button
                            size="sm"
                            onClick={handleSubmitReply}
                            disabled={!replyContent.trim() || isSubmitting}
                          >
                            답글 작성
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 댓글 수정 폼 */}
                  {editingComment?.commentId === comment.commentId && (
                    <div className="p-4 bg-gray-50">
                      <div className="space-y-3">
                        <Textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="min-h-[80px]"
                        />
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingComment(null)}
                          >
                            취소
                          </Button>
                          <Button
                            size="sm"
                            onClick={handleUpdateComment}
                            disabled={!editContent.trim() || isSubmitting}
                          >
                            수정 완료
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {index < comments.length - 1 && (
                    <div className="border-b border-gray-100" />
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}