'use client';

import React, { useState, useEffect } from 'react';
import { X, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

interface ImageOverlayProps {
  src: string;
  alt?: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ImageOverlay({ src, alt = '이미지', isOpen, onClose }: ImageOverlayProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // 오버레이가 열릴 때 초기화
  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      setScale(1);
      setPosition({ x: 0, y: 0 });
    }
  }, [isOpen]);

  // 줌 인/아웃
  const zoomIn = () => setScale(prev => Math.min(prev * 1.3, 4));
  const zoomOut = () => setScale(prev => Math.max(prev / 1.3, 0.5));
  const resetZoom = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  // 마우스 휠 줌
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setScale(prev => Math.min(Math.max(prev * delta, 0.5), 4));
  };

  // 드래그 시작
  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
    }
  };

  // 드래그 중
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && scale > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  // 드래그 종료
  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
        <DialogTitle className="sr-only">
          이미지 뷰어
        </DialogTitle>
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={zoomOut}
              className="h-8 w-8 p-0"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            
            <span className="text-sm font-medium min-w-[50px] text-center">
              {Math.round(scale * 100)}%
            </span>
            
            <Button
              variant="outline"
              size="sm"
              onClick={zoomIn}
              className="h-8 w-8 p-0"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            
            <div className="w-px h-4 bg-gray-300 mx-2" />
            
            <Button
              variant="outline"
              size="sm"
              onClick={resetZoom}
              className="h-8 w-8 p-0"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* 이미지 영역 */}
        <div
          className="relative bg-gray-100 flex items-center justify-center overflow-hidden"
          style={{ height: '60vh', maxHeight: '500px' }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
        >
          {/* 로딩 인디케이터 */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-400 border-t-transparent"></div>
            </div>
          )}

          {/* 이미지 */}
          <img
            src={src}
            alt={alt}
            className="max-w-full max-h-full object-contain select-none"
            style={{
              transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
              transition: isDragging ? 'none' : 'transform 0.2s ease-out',
              cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default'
            }}
            onLoad={() => setIsLoading(false)}
            onError={() => setIsLoading(false)}
            draggable={false}
          />
        </div>

        {/* 푸터 */}
        <div className="p-3 border-t text-center bg-gray-50">
          <p className="text-xs text-gray-500">
            마우스 휠로 확대/축소 • 드래그로 이동 • ESC로 닫기
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}