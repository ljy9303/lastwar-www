'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import BulletList from '@tiptap/extension-bullet-list';
import OrderedList from '@tiptap/extension-ordered-list';
import ListItem from '@tiptap/extension-list-item';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import HardBreak from '@tiptap/extension-hard-break';
import { CustomImageExtension } from './custom-image-extension';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Save, 
  X, 
  Upload,
  Image as ImageIcon,
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading,
  ChevronDown,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify
} from 'lucide-react';
import { boardApi } from '@/lib/board-api';
import { BoardCategory, BoardPostRequest, ContentImageRequest } from '@/types/board';

interface BoardPostFormProps {
  postId?: number; // 수정 모드인 경우
  initialData?: {
    title: string;
    content: string;
    categoryId: number;
    thumbnailUrl?: string;
    contentImages?: ContentImageRequest[];  // 기존 이미지 정보
  };
}

export function BoardPostForm({ postId, initialData }: BoardPostFormProps) {
  const router = useRouter();
  const [categories, setCategories] = useState<BoardCategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(true);

  // 폼 데이터
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    content: initialData?.content || '',
    categoryId: initialData?.categoryId || 0
  });

  // 기존 이미지 (수정 모드에서 S3에 이미 업로드된 이미지)
  const [existingImages, setExistingImages] = useState<ContentImageRequest[]>(initialData?.contentImages || []);
  
  // 새로 추가된 이미지 (blob URL로 임시 저장, 저장 시 S3에 업로드)
  const [newImages, setNewImages] = useState<ContentImageRequest[]>([]);
  
  // 임시 이미지 파일 저장 (blob URL과 실제 File 객체 매핑)
  const [tempImageFiles, setTempImageFiles] = useState<Map<string, File>>(new Map());

  // TipTap 에디터 설정
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // StarterKit에서 리스트 비활성화하고 별도로 설정
        bulletList: false,
        orderedList: false,
        listItem: false,
      }),
      // 리스트 확장 명시적 추가
      BulletList.configure({
        HTMLAttributes: {
          class: 'tiptap-bullet-list',
        },
      }),
      OrderedList.configure({
        HTMLAttributes: {
          class: 'tiptap-ordered-list',
        },
      }),
      ListItem.configure({
        HTMLAttributes: {
          class: 'tiptap-list-item',
        },
      }),
      TextStyle,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      HardBreak.configure({
        HTMLAttributes: {
          class: 'tiptap-hard-break',
        },
      }),
      CustomImageExtension.configure({
        inline: false,
        allowBase64: true,
      }),
      Placeholder.configure({
        placeholder: '게시글 내용을 입력하세요. 이미지를 붙여넣기하면 자동으로 삽입됩니다...',
      }),
    ],
    content: formData.content,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      setFormData(prev => ({ ...prev, content: html }));
    },
  });

  // 컴포넌트 정리 시 임시 blob URL들 해제
  useEffect(() => {
    return () => {
      // 컴포넌트 언마운트 시 모든 임시 blob URL 정리
      tempImageFiles.forEach((file, blobUrl) => {
        URL.revokeObjectURL(blobUrl);
      });
    };
  }, [tempImageFiles]);

  // 카테고리 로드
  const loadCategories = async () => {
    try {
      setIsCategoriesLoading(true);
      const categoriesData = await boardApi.getCategories();
      setCategories(categoriesData.filter(cat => cat.isActive));
    } catch (err) {
      console.error('카테고리 로드 실패:', err);
    } finally {
      setIsCategoriesLoading(false);
    }
  };

  // 에디터 내용에서 blob URL을 찾아서 실제 S3 업로드로 변환
  const uploadTempImages = async (content: string): Promise<{ newContent: string; uploadedImages: ContentImageRequest[] }> => {
    let newContent = content;
    const uploadedImages: ContentImageRequest[] = [];
    
    // blob URL 패턴 찾기
    const blobUrlRegex = /src="(blob:[^"]+)"/g;
    const matches = Array.from(content.matchAll(blobUrlRegex));
    
    for (const match of matches) {
      const blobUrl = match[1];
      const file = tempImageFiles.get(blobUrl);
      
      if (file) {
        try {
          // 실제 S3 업로드
          const uploadResult = await boardApi.uploadImage(file);
          
          // content에서 blob URL을 실제 URL로 변경
          newContent = newContent.replace(blobUrl, uploadResult.imageUrl);
          
          // 업로드된 이미지 정보 저장
          uploadedImages.push({
            imageUrl: uploadResult.imageUrl,
            imageKey: uploadResult.imageKey
          });
          
          // 임시 blob URL 정리
          URL.revokeObjectURL(blobUrl);
        } catch (err) {
          console.error('이미지 업로드 실패:', blobUrl, err);
          throw new Error(`이미지 업로드에 실패했습니다: ${file.name}`);
        }
      }
    }
    
    console.log('이미지 업로드 완료:', { uploadedCount: uploadedImages.length, existingCount: existingImages.length });
    return { newContent, uploadedImages };
  };

  // 폼 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.content.trim() || !formData.categoryId) {
      alert('모든 필수 항목을 입력해주세요.');
      return;
    }

    try {
      setIsLoading(true);
      console.log('게시글 저장 시작:', { 
        mode: postId ? '수정' : '생성',
        existingImagesCount: existingImages.length,
        tempImagesCount: tempImageFiles.size 
      });

      // 임시 이미지들을 실제 S3에 업로드하고 content 업데이트
      const { newContent, uploadedImages } = await uploadTempImages(formData.content);
      
      // 임시 파일 매핑 정리
      tempImageFiles.forEach((file, blobUrl) => {
        URL.revokeObjectURL(blobUrl);
      });
      setTempImageFiles(new Map());

      // 최종 이미지 목록: 기존 이미지 + 새로 업로드된 이미지
      const finalImages = [...existingImages, ...uploadedImages];
      
      const request: BoardPostRequest = {
        categoryId: formData.categoryId,
        title: formData.title.trim(),
        content: newContent,
        contentImages: finalImages
      };
      
      console.log('요청 데이터:', {
        title: request.title,
        contentLength: newContent.length,
        totalImages: finalImages.length,
        existingImages: existingImages.length,
        newImages: uploadedImages.length
      });

      if (postId) {
        // 수정 모드: 기존 이미지 보존 + 새 이미지 추가
        const updatedPost = await boardApi.updatePost(postId, request);
        console.log('게시글 수정 완료:', updatedPost.postId);
        router.push(`/board/posts/${updatedPost.postId}`);
      } else {
        // 생성 모드
        const newPost = await boardApi.createPost(request);
        console.log('게시글 생성 완료:', newPost.postId);
        router.push(`/board/posts/${newPost.postId}`);
      }
    } catch (err) {
      console.error('게시글 저장 실패:', err);
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.';
      alert(`게시글 저장에 실패했습니다: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 이미지 크기 옵션 정의
  const imageSizeOptions = [
    { label: '소형', value: 'small', width: 200 },
    { label: '중형', value: 'medium', width: 300 },
    { label: '대형', value: 'large', width: 450 },
    { label: '최대', value: 'xlarge', width: 600 },
    { label: '원본', value: 'original', width: 0 }
  ];

  // 적절한 미리 정의된 크기 찾기
  const findBestFitSize = (naturalWidth: number, naturalHeight: number) => {
    const editorContainer = document.querySelector('.ProseMirror');
    const containerWidth = editorContainer ? editorContainer.clientWidth - 40 : 500;
    const maxWidth = Math.min(containerWidth, 700);
    
    // 원본이 컨테이너보다 크면 최대 크기에 맞춰서 축소
    let targetWidth = naturalWidth;
    if (naturalWidth > maxWidth) {
      targetWidth = maxWidth;
    }
    
    // 미리 정의된 크기 중에서 가장 가까운 크기 찾기
    const predefinedSizes = imageSizeOptions.filter(option => option.value !== 'original').map(option => option.width);
    
    let bestSize = predefinedSizes[0]; // 기본값: 소형
    let minDifference = Math.abs(targetWidth - bestSize);
    
    for (const size of predefinedSizes) {
      const difference = Math.abs(targetWidth - size);
      if (difference < minDifference) {
        minDifference = difference;
        bestSize = size;
      }
    }
    
    // 원본이 모든 미리 정의된 크기보다 크면 가장 큰 크기 사용
    if (targetWidth > Math.max(...predefinedSizes)) {
      bestSize = Math.min(Math.max(...predefinedSizes), maxWidth);
    }
    
    const aspectRatio = naturalHeight / naturalWidth;
    return {
      width: bestSize,
      height: Math.round(bestSize * aspectRatio)
    };
  };

  // 이미지를 임시 blob URL로 에디터에 삽입 (실제 업로드는 저장 시 수행)
  const handleImageUpload = async (file: File) => {
    try {
      // 임시 blob URL 생성
      const tempUrl = URL.createObjectURL(file);
      
      // 임시 파일 매핑 저장
      setTempImageFiles(prev => {
        const newMap = new Map(prev);
        newMap.set(tempUrl, file);
        return newMap;
      });
      
      // 이미지 크기 미리 계산해서 삽입
      const img = new Image();
      img.onload = () => {
        const { width, height } = findBestFitSize(img.naturalWidth, img.naturalHeight);
        
        if (editor) {
          editor.chain().focus().setImage({ 
            src: tempUrl, 
            alt: file.name,
            width,
            height
          }).run();
        }
      };
      img.src = tempUrl;
      
    } catch (err) {
      console.error('이미지 처리 실패:', err);
      alert('이미지 처리에 실패했습니다.');
    }
  };

  // 클립보드 이미지 붙여넣기 처리
  const handlePaste = async (event: ClipboardEvent) => {
    const items = event.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.indexOf('image') !== -1) {
        event.preventDefault();
        const file = item.getAsFile();
        if (file) {
          await handleImageUpload(file);
        }
      }
    }
  };

  // 제목 필드에서 Tab 키 처리 (에디터로 포커싱)
  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Tab' && !e.shiftKey) {
      e.preventDefault();
      // 에디터로 포커싱
      if (editor) {
        editor.commands.focus();
      }
    }
  };

  // 에디터에 붙여넣기 이벤트 리스너 추가
  useEffect(() => {
    if (editor) {
      const editorElement = editor.view.dom as HTMLElement;
      editorElement.addEventListener('paste', handlePaste);
      
      return () => {
        editorElement.removeEventListener('paste', handlePaste);
      };
    }
  }, [editor]);


  // 헤딩 설정 함수
  const setHeading = (level: number) => {
    if (!editor) return;
    
    if (level === 0) {
      // 일반 텍스트로 변경
      editor.chain().focus().setParagraph().run();
    } else {
      // 헤딩 레벨 설정 (h1~h6)
      editor.chain().focus().toggleHeading({ level: level as 1 | 2 | 3 | 4 | 5 | 6 }).run();
    }
  };


  useEffect(() => {
    loadCategories();
  }, []);

  // 초기 데이터 설정 (수정 모드에서 기존 컨텐츠와 이미지 로드)
  useEffect(() => {
    if (editor && initialData?.content) {
      console.log('수정 모드 초기 데이터 로드:', {
        contentLength: initialData.content.length,
        existingImagesCount: existingImages.length
      });
      editor.commands.setContent(initialData.content);
    }
  }, [editor, initialData, existingImages.length]);

  return (
    <div className="w-full">
      <Card>
          <CardHeader>
            <CardTitle>
              {postId ? '게시글 수정' : '새 게시글 작성'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 카테고리 선택 */}
              <div className="space-y-2">
                <Label htmlFor="category">카테고리 *</Label>
                {isCategoriesLoading ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <Select
                    value={formData.categoryId.toString()}
                    onValueChange={(value) => 
                      setFormData(prev => ({ ...prev, categoryId: parseInt(value) }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="카테고리를 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category.categoryId} value={category.categoryId.toString()}>
                          {category.categoryName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* 제목 */}
              <div className="space-y-2">
                <Label htmlFor="title">제목 *</Label>
                <Input
                  id="title"
                  placeholder="게시글 제목을 입력하세요"
                  value={formData.title}
                  onChange={(e) => 
                    setFormData(prev => ({ ...prev, title: e.target.value }))
                  }
                  onKeyDown={handleTitleKeyDown}
                  maxLength={200}
                />
                <div className="text-sm text-gray-500 text-right">
                  {formData.title.length}/200
                </div>
              </div>

              {/* WYSIWYG 에디터 */}
              <div className="space-y-3">
                <Label>내용 *</Label>
                
                {/* 툴바 */}
                {editor && (
                  <div className="border border-b-0 rounded-t-lg p-2 bg-gray-50 flex gap-1 flex-wrap">
                    <Button
                      type="button"
                      variant={editor.isActive('bold') ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => editor.chain().focus().toggleBold().run()}
                    >
                      <Bold className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant={editor.isActive('italic') ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => editor.chain().focus().toggleItalic().run()}
                    >
                      <Italic className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant={editor.isActive('bulletList') ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => editor.chain().focus().toggleBulletList().run()}
                    >
                      <List className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant={editor.isActive('orderedList') ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    >
                      <ListOrdered className="h-4 w-4" />
                    </Button>
                    
                    {/* 구분선 */}
                    <div className="w-px h-6 bg-gray-300 mx-1" />
                    
                    {/* 헤딩 드롭다운 */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          title="헤딩 선택"
                        >
                          <Heading className="h-4 w-4 mr-1" />
                          제목
                          <ChevronDown className="h-3 w-3 ml-1" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-32">
                        <DropdownMenuItem 
                          onClick={() => setHeading(0)}
                          className="cursor-pointer"
                        >
                          일반 텍스트
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => setHeading(1)}
                          className="cursor-pointer font-bold text-lg"
                        >
                          제목 1
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => setHeading(2)}
                          className="cursor-pointer font-bold text-base"
                        >
                          제목 2
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => setHeading(3)}
                          className="cursor-pointer font-semibold"
                        >
                          제목 3
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => setHeading(4)}
                          className="cursor-pointer font-medium"
                        >
                          제목 4
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => setHeading(5)}
                          className="cursor-pointer font-medium text-sm"
                        >
                          제목 5
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => setHeading(6)}
                          className="cursor-pointer font-medium text-xs"
                        >
                          제목 6
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    
                    {/* 구분선 */}
                    <div className="w-px h-6 bg-gray-300 mx-1" />
                    
                    {/* 텍스트 정렬 버튼들 */}
                    <Button
                      type="button"
                      variant={editor.isActive({ textAlign: 'left' }) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => editor.chain().focus().setTextAlign('left').run()}
                      title="왼쪽 정렬"
                    >
                      <AlignLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant={editor.isActive({ textAlign: 'center' }) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => editor.chain().focus().setTextAlign('center').run()}
                      title="가운데 정렬"
                    >
                      <AlignCenter className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant={editor.isActive({ textAlign: 'right' }) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => editor.chain().focus().setTextAlign('right').run()}
                      title="오른쪽 정렬"
                    >
                      <AlignRight className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant={editor.isActive({ textAlign: 'justify' }) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => editor.chain().focus().setTextAlign('justify').run()}
                      title="양쪽 정렬"
                    >
                      <AlignJustify className="h-4 w-4" />
                    </Button>
                    
                    {/* 구분선 */}
                    <div className="w-px h-6 bg-gray-300 mx-1" />
                    
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById('editor-image-upload')?.click()}
                    >
                      <ImageIcon className="h-4 w-4" />
                    </Button>
                    <input
                      id="editor-image-upload"
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        files.forEach(file => handleImageUpload(file));
                      }}
                    />
                    
                  </div>
                )}
                
                {/* 에디터 */}
                <div className="border border-t-0 rounded-b-lg min-h-[500px] p-4 focus-within:ring-2 focus-within:ring-blue-500">
                  <EditorContent 
                    editor={editor} 
                    className="prose prose-sm max-w-none min-h-[450px] focus:outline-none"
                  />
                </div>
                
                <div className="text-sm text-gray-500 text-right space-y-1">
                  <div>{formData.content.replace(/<[^>]*>/g, '').length}자</div>
                  <div>
                    {postId ? (
                      <>기존 이미지: {existingImages.length}개 | 새 이미지: {tempImageFiles.size}개</>
                    ) : (
                      <>이미지: {tempImageFiles.size}개</>
                    )}
                  </div>
                  <div className="text-xs">이미지 붙여넣기(Ctrl+V)나 위 버튼으로 이미지 추가 가능</div>
                </div>
              </div>


              {/* 액션 버튼 */}
              <div className="flex gap-3 justify-end pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                >
                  <X className="h-4 w-4 mr-2" />
                  취소
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading || !formData.title.trim() || !formData.content.trim() || !formData.categoryId}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isLoading ? '저장 중...' : postId ? '수정하기' : '작성하기'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
    </div>
  );
}