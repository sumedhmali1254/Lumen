import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Image, CheckCircle, X, FileImage } from 'lucide-react';

export default function UploadZone({ onFileSelected, selectedFile, onClear }) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [preview, setPreview] = useState(null);
  const fileInputRef = useRef(null);

  const handleFile = useCallback((file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (JPG, PNG)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(file);
    onFileSelected(file);
  }, [onFileSelected]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  }, [handleFile]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleClick = () => fileInputRef.current?.click();

  const handleInputChange = (e) => {
    const file = e.target.files[0];
    handleFile(file);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    setPreview(null);
    onClear();
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <section id="analyze" className="px-6 pb-10">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-shell-heading mb-2">Upload & Analyze</h2>
            <p className="text-sm text-shell-muted">Drag and drop a chest X-ray image or click to browse</p>
          </div>

          <div
            onClick={!selectedFile ? handleClick : undefined}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`
              glass-card relative overflow-hidden cursor-pointer transition-all duration-300
              ${isDragOver ? 'scale-[1.03] border-primary shadow-xl' : ''}
              ${selectedFile ? 'cursor-default' : 'hover:-translate-y-0.5 hover:shadow-lg'}
            `}
            style={{
              animation: isDragOver ? 'glow-pulse-border 1.5s ease-in-out infinite' : 'none',
              borderColor: isDragOver ? '#2F6FED' : undefined,
            }}
            role="button"
            tabIndex={0}
            aria-label="Upload chest X-ray image"
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleClick(); }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/jpg"
              onChange={handleInputChange}
              className="hidden"
              aria-hidden="true"
            />

            <AnimatePresence mode="wait">
              {!selectedFile ? (
                <motion.div
                  key="dropzone"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex flex-col items-center justify-center py-16 px-8"
                >
                  <motion.div
                    animate={{ y: [0, -6, 0] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                    className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center mb-5"
                  >
                    <Upload className="w-7 h-7 text-primary" />
                  </motion.div>
                  <p className="text-base font-semibold text-shell-heading mb-1">
                    Drop your chest X-ray here
                  </p>
                  <p className="text-sm text-shell-muted mb-4">
                    or click to browse · JPG, PNG supported
                  </p>
                  <div className="flex items-center gap-2 text-xs text-shell-muted">
                    <FileImage className="w-3.5 h-3.5" />
                    Max file size: 10MB
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="preview"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  className="p-6"
                >
                  <div className="flex items-start gap-5">
                    {/* Thumbnail */}
                    <div className="relative shrink-0">
                      <div className="w-28 h-28 rounded-xl overflow-hidden bg-gray-100 border border-black/[0.05]">
                        {preview && (
                          <img
                            src={preview}
                            alt="X-ray preview"
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.3, type: 'spring', stiffness: 400 }}
                        className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-success text-white flex items-center justify-center shadow-md"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                      </motion.div>
                    </div>

                    {/* File Info */}
                    <div className="flex-1 min-w-0 pt-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Image className="w-4 h-4 text-shell-muted shrink-0" />
                        <p className="text-sm font-semibold text-shell-heading truncate">
                          {selectedFile.name}
                        </p>
                      </div>
                      <p className="text-xs text-shell-muted mb-3">
                        {(selectedFile.size / 1024).toFixed(1)} KB · {selectedFile.type}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-success/10 text-success text-xs font-semibold">
                          <CheckCircle className="w-3 h-3" />
                          Ready to analyze
                        </span>
                      </div>
                    </div>

                    {/* Clear Button */}
                    <button
                      onClick={handleClear}
                      className="p-2 rounded-lg hover:bg-black/[0.04] text-shell-muted hover:text-shell-heading transition-colors shrink-0"
                      aria-label="Remove file"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
