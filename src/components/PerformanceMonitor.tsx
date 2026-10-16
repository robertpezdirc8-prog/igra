import { useEffect, useState } from 'react';

interface PerformanceMonitorProps {
  isVisible: boolean;
}

export function PerformanceMonitor({ isVisible }: PerformanceMonitorProps) {
  const [fps, setFps] = useState(0);
  const [frameTime, setFrameTime] = useState(0);
  const [memory, setMemory] = useState(0);

  useEffect(() => {
    if (!isVisible) return;

    let lastTime = performance.now();
    let frameCount = 0;

    const updateMetrics = () => {
      const now = performance.now();
      const delta = now - lastTime;
      frameCount++;

      if (delta >= 1000) {
        setFps(Math.round((frameCount * 1000) / delta));
        setFrameTime(Math.round(delta / frameCount * 100) / 100);
        
        // Memory usage (if available)
        const perf = performance as any;
        if (perf.memory) {
          setMemory(Math.round(perf.memory.usedJSHeapSize / 1048576));
        }
        
        frameCount = 0;
        lastTime = now;
      }

      requestAnimationFrame(updateMetrics);
    };

    const frameId = requestAnimationFrame(updateMetrics);
    return () => cancelAnimationFrame(frameId);
  }, [isVisible]);

  if (!isVisible) return null;

  const getFpsColor = () => {
    if (fps >= 55) return 'text-green-400';
    if (fps >= 30) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="fixed top-4 right-4 z-50 bg-black/80 border border-cyan-400/30 rounded-lg p-3 font-mono text-xs backdrop-blur-sm">
      <div className="space-y-1">
        <div className="flex justify-between gap-4">
          <span className="text-gray-400">FPS:</span>
          <span className={getFpsColor()}>{fps}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-gray-400">Frame:</span>
          <span className="text-cyan-400">{frameTime}ms</span>
        </div>
        {memory > 0 && (
          <div className="flex justify-between gap-4">
            <span className="text-gray-400">Memory:</span>
            <span className="text-purple-400">{memory}MB</span>
          </div>
        )}
      </div>
    </div>
  );
}
