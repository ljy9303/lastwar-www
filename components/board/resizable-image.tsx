'use client';

import React, { useState, useRef, useEffect } from 'react';
import { NodeViewWrapper } from '@tiptap/react';

interface ResizableImageProps {
  node: any;
  updateAttributes: (attributes: any) => void;
  selected: boolean;
}

export function ResizableImage({ node, updateAttributes, selected }: ResizableImageProps) {
  const [isResizing, setIsResizing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [startSize, setStartSize] = useState({ width: 0, height: 0 });
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { src, alt, width, height } = node.attrs;

  useEffect(() => {
    // 이미지가 로드되면 기본 크기 설정
    if (imageRef.current && !width && !height) {
      const img = imageRef.current;
      img.onload = () => {
        const naturalWidth = img.naturalWidth;
        const naturalHeight = img.naturalHeight;
        
        // 에디터 컨테이너 크기 기준으로 최대 크기 계산
        const editorContainer = document.querySelector('.ProseMirror');
        const containerWidth = editorContainer ? editorContainer.clientWidth - 40 : 500; // 패딩 고려
        const maxWidth = Math.min(containerWidth, 700); // 컨테이너 크기와 700px 중 작은 값
        
        if (naturalWidth > maxWidth) {
          const ratio = maxWidth / naturalWidth;
          updateAttributes({
            width: maxWidth,
            height: naturalHeight * ratio
          });
        } else {
          updateAttributes({
            width: naturalWidth,
            height: naturalHeight
          });
        }
      };
    }
  }, [src, width, height, updateAttributes]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    setStartPos({ x: e.clientX, y: e.clientY });
    setStartSize({ 
      width: width || imageRef.current?.offsetWidth || 0,
      height: height || imageRef.current?.offsetHeight || 0
    });
  };

  // 미리 정의된 크기에 스냅하는 함수
  const snapToPresetSize = (targetWidth: number) => {
    const presetSizes = [200, 300, 450, 600]; // 소형, 중형, 대형, 특대
    const snapThreshold = 30; // 30px 이내면 스냅
    
    for (const presetSize of presetSizes) {
      if (Math.abs(targetWidth - presetSize) <= snapThreshold) {
        return presetSize;
      }
    }
    return targetWidth;
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const deltaX = e.clientX - startPos.x;
      const aspectRatio = startSize.height / startSize.width;
      
      // 에디터 컨테이너 크기 동적으로 계산
      const editorContainer = document.querySelector('.ProseMirror');
      const containerWidth = editorContainer ? editorContainer.clientWidth - 40 : 500;
      const maxWidth = Math.min(containerWidth, 700);
      
      // 기본 크기 계산
      const rawWidth = Math.max(100, Math.min(maxWidth, startSize.width + deltaX));
      
      // 미리 정의된 크기에 스냅
      const snappedWidth = snapToPresetSize(rawWidth);
      const newHeight = snappedWidth * aspectRatio;

      updateAttributes({
        width: Math.round(snappedWidth),
        height: Math.round(newHeight)
      });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, startPos, startSize, updateAttributes]);

  return (
    <NodeViewWrapper className="resizable-image-wrapper">
      <div
        ref={containerRef}
        className={`relative inline-block ${selected ? 'ring-2 ring-blue-500' : ''}`}
        style={{
          width: width ? `${width}px` : 'auto',
          height: height ? `${height}px` : 'auto',
        }}
      >
        <img
          ref={imageRef}
          src={src}
          alt={alt || ''}
          className="block max-w-full h-auto rounded cursor-pointer"
          style={{
            width: width ? `${width}px` : 'auto',
            height: height ? `${height}px` : 'auto',
          }}
          draggable={false}
        />
        
        {/* 리사이즈 핸들 */}
        {selected && (
          <>
            {/* 우하단 리사이즈 핸들 */}
            <div
              className="absolute bottom-0 right-0 w-3 h-3 bg-blue-500 border border-white cursor-se-resize transform translate-x-1/2 translate-y-1/2"
              onMouseDown={handleMouseDown}
              style={{ borderRadius: '50%' }}
            />
            {/* 크기 표시 */}
            <div className="absolute top-0 left-0 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
              {width || '?'} × {height || '?'}
              {/* 미리 정의된 크기 표시 */}
              {width && (
                (() => {
                  const presetNames = {
                    200: '소형',
                    300: '중형', 
                    450: '대형',
                    600: '특대'
                  };
                  const presetName = presetNames[width as keyof typeof presetNames];
                  return presetName ? ` (${presetName})` : '';
                })()
              )}
            </div>
          </>
        )}
        
        {isResizing && (
          <div className="absolute inset-0 bg-blue-100 bg-opacity-50 pointer-events-none" />
        )}
      </div>
    </NodeViewWrapper>
  );
}