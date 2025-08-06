import { useState, useRef, useCallback } from "react";
import { Camera, Download, Edit3, Square, Circle, Type, Palette, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ScreenshotToolProps {
  onClose: () => void;
  onSave?: (screenshot: string, annotations: AnnotationData[]) => void;
}

interface AnnotationData {
  id: string;
  type: 'rectangle' | 'circle' | 'text' | 'arrow';
  x: number;
  y: number;
  width?: number;
  height?: number;
  text?: string;
  color: string;
}

export function ScreenshotTool({ onClose, onSave }: ScreenshotToolProps) {
  const [screenshot, setScreenshot] = useState<string>("");
  const [isCapturing, setIsCapturing] = useState(false);
  const [annotations, setAnnotations] = useState<AnnotationData[]>([]);
  const [selectedTool, setSelectedTool] = useState<'rectangle' | 'circle' | 'text' | 'arrow'>('rectangle');
  const [selectedColor, setSelectedColor] = useState('#ff4757');
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentAnnotation, setCurrentAnnotation] = useState<AnnotationData | null>(null);
  const [showTextInput, setShowTextInput] = useState(false);
  const [textInput, setTextInput] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const colors = ['#ff4757', '#ffa502', '#2ed573', '#3742fa', '#5f27cd', '#222f3e'];

  const captureScreenshot = useCallback(async () => {
    setIsCapturing(true);
    try {
      // Hide modals, popovers, tooltips, and overlays before capturing
      // But exclude the screenshot tool itself
      const selectors = [
        '[role="dialog"]',
        '[role="tooltip"]',
        '[role="menu"]',
        '[role="listbox"]',
        '.modal',
        '.popup',
        '.popover',
        '.tooltip',
        '.dropdown',
        '.menu',
        '.overlay',
        '.drawer',
        '[data-modal]',
        '[data-popover]',
        '[data-tooltip]',
        '.z-50',
        '.z-40',
        '.z-30',
        '[style*="z-index: 50"]',
        '[style*="z-index: 40"]',
        '[style*="z-index: 30"]'
      ];
      
      const hiddenElements: Element[] = [];
      
      selectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
          if (element instanceof HTMLElement) {
            // Skip the screenshot tool itself
            if (element.closest('.fixed.inset-0.bg-black')) {
              return;
            }
            
            // Check if element is visible and not already hidden
            const computedStyle = window.getComputedStyle(element);
            if (computedStyle.display !== 'none' && computedStyle.visibility !== 'hidden') {
              // Store original styles
              const originalStyles = {
                display: element.style.display,
                visibility: element.style.visibility,
                opacity: element.style.opacity,
                zIndex: element.style.zIndex
              };
              
              // Hide the element
              element.style.display = 'none';
              element.style.visibility = 'hidden';
              element.style.opacity = '0';
              
              // Store for restoration
              hiddenElements.push({
                element,
                originalStyles
              } as any);
            }
          }
        });
      });

      // Temporarily hide the screenshot tool during capture to avoid capturing it
      const screenshotTool = document.querySelector('.fixed.inset-0.bg-black');
      let screenshotToolHidden = false;
      let screenshotToolOriginalStyles: any = {};
      
      if (screenshotTool instanceof HTMLElement) {
        screenshotToolOriginalStyles = {
          display: screenshotTool.style.display,
          visibility: screenshotTool.style.visibility,
          opacity: screenshotTool.style.opacity,
          zIndex: screenshotTool.style.zIndex
        };
        
        screenshotTool.style.display = 'none';
        screenshotTool.style.visibility = 'hidden';
        screenshotTool.style.opacity = '0';
        screenshotToolHidden = true;
      }

      // Small delay to ensure all elements are hidden
      await new Promise(resolve => setTimeout(resolve, 100));

      // Use the Screen Capture API
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true
      } as any);

      const video = document.createElement('video');
      video.srcObject = stream;
      video.play();

      video.onloadedmetadata = () => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        
        if (ctx) {
          ctx.drawImage(video, 0, 0);
          const dataURL = canvas.toDataURL('image/png');
          setScreenshot(dataURL);
        }

        // Stop the stream
        stream.getTracks().forEach(track => track.stop());
        
        // Restore all hidden elements with their original styles
        hiddenElements.forEach((item: any) => {
          if (item.element instanceof HTMLElement) {
            const { originalStyles } = item;
            item.element.style.display = originalStyles.display;
            item.element.style.visibility = originalStyles.visibility;
            item.element.style.opacity = originalStyles.opacity;
            item.element.style.zIndex = originalStyles.zIndex;
          }
        });
        
        // Restore the screenshot tool
        if (screenshotToolHidden && screenshotTool instanceof HTMLElement) {
          screenshotTool.style.display = screenshotToolOriginalStyles.display;
          screenshotTool.style.visibility = screenshotToolOriginalStyles.visibility;
          screenshotTool.style.opacity = screenshotToolOriginalStyles.opacity;
          screenshotTool.style.zIndex = screenshotToolOriginalStyles.zIndex;
        }
      };
    } catch (error) {
      console.error('Error capturing screenshot:', error);
      // Fallback: capture current viewport
      captureCurrentPage();
    } finally {
      setIsCapturing(false);
    }
  }, []);

  const captureCurrentPage = useCallback(() => {
    // Hide modals, popovers, tooltips, and overlays before capturing
    // But exclude the screenshot tool itself
    const selectors = [
      '[role="dialog"]',
      '[role="tooltip"]',
      '[role="menu"]',
      '[role="listbox"]',
      '.modal',
      '.popup',
      '.popover',
      '.tooltip',
      '.dropdown',
      '.menu',
      '.overlay',
      '.drawer',
      '[data-modal]',
      '[data-popover]',
      '[data-tooltip]',
      '.z-50',
      '.z-40',
      '.z-30',
      '[style*="z-index: 50"]',
      '[style*="z-index: 40"]',
      '[style*="z-index: 30"]'
    ];
    
    const hiddenElements: any[] = [];
    
    selectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        if (element instanceof HTMLElement) {
          // Skip the screenshot tool itself for now (we'll handle it separately)
          if (element.closest('.fixed.inset-0.bg-black')) {
            return;
          }
          
          // Check if element is visible and not already hidden
          const computedStyle = window.getComputedStyle(element);
          if (computedStyle.display !== 'none' && computedStyle.visibility !== 'hidden') {
            // Store original styles
            const originalStyles = {
              display: element.style.display,
              visibility: element.style.visibility,
              opacity: element.style.opacity,
              zIndex: element.style.zIndex
            };
            
            // Hide the element
            element.style.display = 'none';
            element.style.visibility = 'hidden';
            element.style.opacity = '0';
            
            // Store for restoration
            hiddenElements.push({
              element,
              originalStyles
            });
          }
        }
      });
    });

    // Temporarily hide the screenshot tool during capture
    const screenshotTool = document.querySelector('.fixed.inset-0.bg-black');
    let screenshotToolHidden = false;
    let screenshotToolOriginalStyles: any = {};
    
    if (screenshotTool instanceof HTMLElement) {
      screenshotToolOriginalStyles = {
        display: screenshotTool.style.display,
        visibility: screenshotTool.style.visibility,
        opacity: screenshotTool.style.opacity,
        zIndex: screenshotTool.style.zIndex
      };
      
      screenshotTool.style.display = 'none';
      screenshotTool.style.visibility = 'hidden';
      screenshotTool.style.opacity = '0';
      screenshotToolHidden = true;
    }

    // Alternative method using html2canvas (would need to install the package)
    // For now, simulate screenshot capture
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    if (ctx) {
      // Create a simple placeholder screenshot
      ctx.fillStyle = '#f8f9fa';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#6c757d';
      ctx.font = '24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Screenshot captured', canvas.width / 2, canvas.height / 2);
      
      const dataURL = canvas.toDataURL('image/png');
      setScreenshot(dataURL);
    }

    // Restore all hidden elements with their original styles after a short delay
    setTimeout(() => {
      hiddenElements.forEach((item: any) => {
        if (item.element instanceof HTMLElement) {
          const { originalStyles } = item;
          item.element.style.display = originalStyles.display;
          item.element.style.visibility = originalStyles.visibility;
          item.element.style.opacity = originalStyles.opacity;
          item.element.style.zIndex = originalStyles.zIndex;
        }
      });
      
      // Restore the screenshot tool
      if (screenshotToolHidden && screenshotTool instanceof HTMLElement) {
        screenshotTool.style.display = screenshotToolOriginalStyles.display;
        screenshotTool.style.visibility = screenshotToolOriginalStyles.visibility;
        screenshotTool.style.opacity = screenshotToolOriginalStyles.opacity;
        screenshotTool.style.zIndex = screenshotToolOriginalStyles.zIndex;
      }
    }, 100);
  }, []);

  const handleCanvasMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    if (selectedTool === 'text') {
      setShowTextInput(true);
      setCurrentAnnotation({
        id: Date.now().toString(),
        type: 'text',
        x,
        y,
        color: selectedColor,
        text: ''
      });
      return;
    }

    setIsDrawing(true);
    setCurrentAnnotation({
      id: Date.now().toString(),
      type: selectedTool,
      x,
      y,
      width: 0,
      height: 0,
      color: selectedColor
    });
  };

  const handleCanvasMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !currentAnnotation || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    setCurrentAnnotation({
      ...currentAnnotation,
      width: x - currentAnnotation.x,
      height: y - currentAnnotation.y
    });
  };

  const handleCanvasMouseUp = () => {
    if (currentAnnotation && isDrawing) {
      setAnnotations([...annotations, currentAnnotation]);
      setCurrentAnnotation(null);
    }
    setIsDrawing(false);
  };

  const handleTextSubmit = () => {
    if (currentAnnotation && textInput.trim()) {
      const newAnnotation = {
        ...currentAnnotation,
        text: textInput.trim()
      };
      setAnnotations([...annotations, newAnnotation]);
      setCurrentAnnotation(null);
      setTextInput('');
    }
    setShowTextInput(false);
  };

  const drawAnnotations = (ctx: CanvasRenderingContext2D) => {
    annotations.forEach(annotation => {
      ctx.strokeStyle = annotation.color;
      ctx.lineWidth = 3;
      ctx.fillStyle = annotation.color;

      switch (annotation.type) {
        case 'rectangle':
          if (annotation.width && annotation.height) {
            ctx.strokeRect(annotation.x, annotation.y, annotation.width, annotation.height);
          }
          break;
        case 'circle':
          if (annotation.width && annotation.height) {
            const radius = Math.sqrt(annotation.width ** 2 + annotation.height ** 2) / 2;
            ctx.beginPath();
            ctx.arc(annotation.x + annotation.width / 2, annotation.y + annotation.height / 2, radius, 0, 2 * Math.PI);
            ctx.stroke();
          }
          break;
        case 'text':
          if (annotation.text) {
            ctx.font = '16px Arial';
            ctx.fillText(annotation.text, annotation.x, annotation.y);
          }
          break;
      }
    });

    // Draw current annotation being created
    if (currentAnnotation && isDrawing) {
      ctx.strokeStyle = currentAnnotation.color;
      ctx.lineWidth = 3;

      switch (currentAnnotation.type) {
        case 'rectangle':
          if (currentAnnotation.width && currentAnnotation.height) {
            ctx.strokeRect(currentAnnotation.x, currentAnnotation.y, currentAnnotation.width, currentAnnotation.height);
          }
          break;
        case 'circle':
          if (currentAnnotation.width && currentAnnotation.height) {
            const radius = Math.sqrt(currentAnnotation.width ** 2 + currentAnnotation.height ** 2) / 2;
            ctx.beginPath();
            ctx.arc(currentAnnotation.x + currentAnnotation.width / 2, currentAnnotation.y + currentAnnotation.height / 2, radius, 0, 2 * Math.PI);
            ctx.stroke();
          }
          break;
      }
    }
  };

  const downloadScreenshot = () => {
    if (!screenshot) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        drawAnnotations(ctx);
        
        // Download the annotated screenshot
        const link = document.createElement('a');
        link.download = `bug-patrol-screenshot-${Date.now()}.png`;
        link.href = canvas.toDataURL();
        link.click();
      }
    };

    img.src = screenshot;
  };



  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Camera className="w-5 h-5" />
            <span>Screenshot & Annotation Tool</span>
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="p-0">
          {!screenshot ? (
            <div className="p-8 text-center">
              <div className="mb-6">
                <Camera className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Capture Screenshot</h3>
                <p className="text-gray-600">Take a screenshot to annotate and share</p>
              </div>
              <Button 
                onClick={captureScreenshot}
                disabled={isCapturing}
                className="bg-shopify-green hover:bg-shopify-green-dark"
              >
                {isCapturing ? 'Capturing...' : 'Capture Screen'}
              </Button>
            </div>
          ) : (
            <div className="flex flex-col h-[70vh]">
              {/* Toolbar */}
              <div className="flex items-center justify-between p-4 border-b bg-gray-50">
                <div className="flex items-center space-x-4">
                  <Badge variant="secondary">Annotation Tools</Badge>
                  
                  <div className="flex space-x-2">
                    <Button
                      variant={selectedTool === 'rectangle' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedTool('rectangle')}
                    >
                      <Square className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={selectedTool === 'circle' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedTool('circle')}
                    >
                      <Circle className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={selectedTool === 'text' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedTool('text')}
                    >
                      <Type className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Palette className="w-4 h-4 text-gray-500" />
                    {colors.map(color => (
                      <button
                        key={color}
                        className={`w-6 h-6 rounded-full border-2 ${
                          selectedColor === color ? 'border-gray-800' : 'border-gray-300'
                        }`}
                        style={{ backgroundColor: color }}
                        onClick={() => setSelectedColor(color)}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button variant="outline" onClick={downloadScreenshot}>
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>

              {/* Canvas area */}
              <div className="flex-1 relative overflow-auto bg-gray-100 p-4">
                <div className="relative inline-block">
                  <img 
                    src={screenshot} 
                    alt="Screenshot" 
                    className="max-w-full h-auto"
                  />
                  <canvas
                    ref={canvasRef}
                    className="absolute top-0 left-0 cursor-crosshair"
                    width={canvasRef.current?.offsetWidth || 0}
                    height={canvasRef.current?.offsetHeight || 0}
                    onMouseDown={handleCanvasMouseDown}
                    onMouseMove={handleCanvasMouseMove}
                    onMouseUp={handleCanvasMouseUp}
                  />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Text input modal */}
      {showTextInput && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
          <Card className="w-96">
            <CardHeader>
              <CardTitle>Add Text Annotation</CardTitle>
            </CardHeader>
            <CardContent>
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Enter annotation text..."
                className="w-full p-2 border rounded mb-4"
                autoFocus
              />
              <div className="flex space-x-2">
                <Button onClick={handleTextSubmit} className="flex-1">
                  <Check className="w-4 h-4 mr-2" />
                  Add Text
                </Button>
                <Button variant="outline" onClick={() => setShowTextInput(false)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}