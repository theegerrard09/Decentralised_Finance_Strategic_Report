import { useEffect, useRef, useState } from 'react';
import { Camera, X, Keyboard } from 'lucide-react';

export default function BarcodeScanner({ onScan, onClose }) {
  const scannerRef = useRef(null);
  const instanceRef = useRef(null);
  const [error, setError] = useState(null);
  const [manualCode, setManualCode] = useState('');
  const [mode, setMode] = useState('camera');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (mode !== 'camera') return;

    let mounted = true;

    const initScanner = async () => {
      try {
        const { Html5Qrcode } = await import('html5-qrcode');

        if (!mounted) return;

        const scanner = new Html5Qrcode('qr-scanner-region');
        instanceRef.current = scanner;

        const devices = await Html5Qrcode.getCameras();
        if (!mounted) return;

        if (!devices || devices.length === 0) {
          setError('No camera found on this device.');
          setLoading(false);
          return;
        }

        const backCamera = devices.find(d =>
          d.label.toLowerCase().includes('back') ||
          d.label.toLowerCase().includes('rear')
        ) || devices[devices.length - 1];

        await scanner.start(
          backCamera.id,
          { fps: 10, qrbox: { width: 250, height: 150 } },
          (decodedText) => {
            if (mounted) {
              onScan(decodedText);
              stopScanner();
            }
          },
          () => {}
        );

        if (mounted) setLoading(false);
      } catch (err) {
        if (mounted) {
          console.error('Scanner error:', err);
          setError(err.message || 'Camera access denied. Please allow camera permissions.');
          setLoading(false);
        }
      }
    };

    initScanner();

    return () => {
      mounted = false;
      stopScanner();
    };
  }, [mode]);

  const stopScanner = () => {
    if (instanceRef.current) {
      instanceRef.current.stop().catch(() => {});
      instanceRef.current = null;
    }
  };

  const handleClose = () => {
    stopScanner();
    onClose();
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualCode.trim()) {
      onScan(manualCode.trim());
    }
  };

  return (
    <div className="space-y-4">
      {/* Mode toggle */}
      <div className="flex gap-2 p-1 glass rounded-xl">
        <button
          onClick={() => setMode('camera')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${
            mode === 'camera' ? 'btn-gold' : 'text-white/60 hover:text-white'
          }`}
        >
          <Camera size={15} /> Camera
        </button>
        <button
          onClick={() => { stopScanner(); setMode('manual'); }}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${
            mode === 'manual' ? 'btn-gold' : 'text-white/60 hover:text-white'
          }`}
        >
          <Keyboard size={15} /> Manual
        </button>
      </div>

      {mode === 'camera' && (
        <div>
          {loading && (
            <div className="flex items-center justify-center h-40 text-white/50 text-sm">
              <div className="text-center">
                <div className="animate-spin w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full mx-auto mb-2" />
                Starting camera...
              </div>
            </div>
          )}
          {error ? (
            <div className="text-center py-6 text-red-300/80 text-sm">
              <Camera size={32} className="mx-auto mb-2 opacity-40" />
              <p>{error}</p>
              <button
                onClick={() => { setError(null); setMode('manual'); }}
                className="mt-3 text-gold-400 underline text-xs"
              >
                Switch to manual entry
              </button>
            </div>
          ) : (
            <div
              id="qr-scanner-region"
              ref={scannerRef}
              className="rounded-xl overflow-hidden"
            />
          )}
          <p className="text-white/40 text-xs text-center mt-2">
            Point your camera at a barcode to scan
          </p>
        </div>
      )}

      {mode === 'manual' && (
        <form onSubmit={handleManualSubmit} className="space-y-3">
          <div>
            <label className="block text-sm text-white/60 mb-1.5">Enter Barcode / Product Code</label>
            <input
              type="text"
              value={manualCode}
              onChange={e => setManualCode(e.target.value)}
              placeholder="e.g. 5449000000996"
              autoFocus
              className="glass-input w-full px-4 py-3 rounded-xl text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={!manualCode.trim()}
            className="btn-gold w-full py-3 rounded-xl text-sm font-bold disabled:opacity-40"
          >
            Search Product
          </button>
        </form>
      )}

      <button
        onClick={handleClose}
        className="w-full py-2.5 btn-glass rounded-xl text-sm text-white/70 flex items-center justify-center gap-2"
      >
        <X size={14} /> Cancel Scanner
      </button>
    </div>
  );
}
