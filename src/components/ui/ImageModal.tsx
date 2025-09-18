'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Download, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  imageAlt?: string;
  className?: string;
}

export default function ImageModal({
  isOpen,
  onClose,
  imageUrl,
  imageAlt = 'Image',
  className
}: ImageModalProps) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);



  // Ensure component is mounted (for SSR compatibility)
  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset zoom and rotation when modal opens
  useEffect(() => {
    if (isOpen) {
      setZoom(1);
      setRotation(0);
      setIsLoading(true);
    }
  }, [isOpen]);

  // Handle escape key (hydration-safe)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.25, 0.5));
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const handleDownload = async () => {
    if (typeof window === 'undefined') return;

    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = imageAlt || 'image';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading image:', error);
    }
  };

  if (!isOpen || !mounted) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-md animate-glass-fade-in"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className={cn(
        "relative z-10 w-[95vw] h-[95vh] max-w-[95vw] max-h-[95vh] glass-card rounded-2xl overflow-hidden animate-glass-slide-up",
        className
      )}>
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-20 p-4 bg-gradient-to-b from-black/50 to-transparent">
          <div className="flex items-center justify-between">
            {/* Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleZoomOut}
                disabled={zoom <= 0.5}
                className="glass-button p-2 rounded-lg hover:scale-110 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Zoom Out"
              >
                <ZoomOut className="h-4 w-4 text-white" />
              </button>
              
              <span className="text-white text-sm font-medium px-2">
                {Math.round(zoom * 100)}%
              </span>
              
              <button
                onClick={handleZoomIn}
                disabled={zoom >= 3}
                className="glass-button p-2 rounded-lg hover:scale-110 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Zoom In"
              >
                <ZoomIn className="h-4 w-4 text-white" />
              </button>
              
              <button
                onClick={handleRotate}
                className="glass-button p-2 rounded-lg hover:scale-110 transition-all duration-300"
                title="Rotate"
              >
                <RotateCw className="h-4 w-4 text-white" />
              </button>
              
              <button
                onClick={handleDownload}
                className="glass-button p-2 rounded-lg hover:scale-110 transition-all duration-300"
                title="Download"
              >
                <Download className="h-4 w-4 text-white" />
              </button>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="glass-button p-2 rounded-lg hover:scale-110 transition-all duration-300 hover:bg-red-500/20"
              title="Close"
            >
              <X className="h-4 w-4 text-white" />
            </button>
          </div>
        </div>

        {/* Image Container */}
        <div className="relative bg-black/20 backdrop-blur-sm h-full overflow-hidden flex items-center justify-center">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            </div>
          )}
          
          <img
            src={imageUrl}
            alt={imageAlt}
            className="max-w-full max-h-full object-contain transition-all duration-300 cursor-grab active:cursor-grabbing"
            style={{
              transform: `scale(${zoom}) rotate(${rotation}deg)`,
              transformOrigin: 'center'
            }}
            onLoad={() => setIsLoading(false)}
            onError={() => setIsLoading(false)}
            draggable={false}
          />
        </div>

        {/* Footer Info */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/50 to-transparent">
          <p className="text-white text-sm text-center opacity-80">
            {imageAlt} • Click outside to close • ESC to exit
          </p>
        </div>
      </div>
    </div>
  );

  // Use portal to render outside of chat container
  return typeof window !== 'undefined' ? createPortal(modalContent, document.body) : null;
}
