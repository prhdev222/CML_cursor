'use client';

import { useState, useRef, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Download, QrCode, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '@/components/ui/Button';
import { getPatientUrl, getServerInfo } from '@/lib/qr-url';

interface PatientQRCodeProps {
  patientId: string;
  patientName: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function PatientQRCode({ patientId, patientName, isOpen, onClose }: PatientQRCodeProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [patientUrl, setPatientUrl] = useState('');
  const [lanInfo, setLanInfo] = useState<{ lanIps: string[]; suggestedUrls: string[] } | null>(null);
  const qrRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Get patient URL, will use LAN IP if available
    const url = getPatientUrl(patientId);
    setPatientUrl(url);

    // Fetch LAN IP info if using localhost
    if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
      getServerInfo().then((info) => {
        if (info) {
          setLanInfo(info);
          // Auto-use first LAN IP if available and no NEXT_PUBLIC_BASE_URL is set
          if (!process.env.NEXT_PUBLIC_BASE_URL && info.suggestedUrls.length > 0) {
            const lanUrl = `${info.suggestedUrls[0]}/patient/${patientId}`;
            setPatientUrl(lanUrl);
          }
        }
      });
    }
  }, [patientId]);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      // Use qrcode library directly to avoid html2canvas lab() color issue
      const QRCode = await import('qrcode');
      
      // Create canvas with text
      const canvas = document.createElement('canvas');
      canvas.width = 600;
      canvas.height = 750;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        setIsDownloading(false);
        return;
      }

      // Fill white background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw border
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 2;
      ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

      // Draw title
      ctx.fillStyle = '#111827';
      ctx.font = 'bold 24px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(patientName, canvas.width / 2, 60);

      // Draw patient ID
      ctx.fillStyle = '#4b5563';
      ctx.font = '16px Arial, sans-serif';
      ctx.fillText(`รหัสผู้ป่วย: ${patientId}`, canvas.width / 2, 90);

      // Generate QR Code
      const qrSize = 400;
      const qrX = (canvas.width - qrSize) / 2;
      const qrY = 120;
      
      // Create temporary canvas for QR code
      const qrCanvas = document.createElement('canvas');
      await QRCode.toCanvas(qrCanvas, patientUrl, {
        width: qrSize,
        margin: 2,
        color: {
          dark: '#1e40af',
          light: '#ffffff',
        },
      });

      // Draw QR code onto main canvas
      ctx.drawImage(qrCanvas, qrX, qrY);

      // Draw URL at bottom
      ctx.fillStyle = '#6b7280';
      ctx.font = '12px Arial, sans-serif';
      const maxWidth = canvas.width - 40;
      const urlLines: string[] = [];
      let currentLine = '';
      const words = patientUrl.split('');
      for (let i = 0; i < words.length; i++) {
        const testLine = currentLine + words[i];
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && currentLine.length > 0) {
          urlLines.push(currentLine);
          currentLine = words[i];
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine.length > 0) {
        urlLines.push(currentLine);
      }
      
      urlLines.forEach((line, index) => {
        ctx.fillText(line, canvas.width / 2, qrY + qrSize + 30 + (index * 18));
      });

      // Download
      const link = document.createElement('a');
      link.download = `QR-Code-${patientId}-${patientName.replace(/\s+/g, '-')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      
      setIsDownloading(false);
    } catch (error) {
      console.error('Error downloading QR code:', error);
      alert('เกิดข้อผิดพลาดในการดาวน์โหลด กรุณาลองใหม่อีกครั้ง');
      setIsDownloading(false);
    }
  };

  return (
    <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">QR Code สำหรับผู้ป่วย</h2>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div 
                  id="qr-code-container" 
                  ref={qrRef}
                  className="bg-white p-6 rounded-xl border-2 border-gray-200 mb-6"
                >
                  <div className="text-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{patientName}</h3>
                    <p className="text-sm text-gray-600">รหัสผู้ป่วย: {patientId}</p>
                  </div>
                  <div className="flex justify-center">
                    <QRCodeSVG
                      value={patientUrl}
                      size={256}
                      level="H"
                      includeMargin={true}
                      fgColor="#1e40af"
                      bgColor="#ffffff"
                    />
                  </div>
                  <div className="mt-4 text-center">
                    <p className="text-xs text-gray-500 break-all">{patientUrl || 'กำลังโหลด...'}</p>
                  </div>
                  {typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && (
                    <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-xs text-yellow-800 mb-2">
                        💡 <strong>หมายเหตุ:</strong> สำหรับให้เครื่องอื่นใน LAN scan ได้ ให้ตั้งค่า <code className="bg-yellow-100 px-1 rounded">NEXT_PUBLIC_BASE_URL</code> ในไฟล์ <code className="bg-yellow-100 px-1 rounded">.env.local</code>
                      </p>
                      {lanInfo && lanInfo.suggestedUrls.length > 0 && (
                        <div className="text-xs text-yellow-900">
                          <p className="font-semibold mb-1">IP Address ที่แนะนำ:</p>
                          {lanInfo.suggestedUrls.map((url, index) => (
                            <code key={index} className="block bg-yellow-100 px-2 py-1 rounded mb-1 break-all">
                              {url}
                            </code>
                          ))}
                          <p className="mt-2 text-yellow-700">
                            เพิ่มใน <code className="bg-yellow-100 px-1 rounded">.env.local</code>:<br />
                            <code className="bg-yellow-100 px-1 rounded">NEXT_PUBLIC_BASE_URL={lanInfo.suggestedUrls[0]}</code>
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-3">
                  <Button
                    onClick={handleDownload}
                    disabled={isDownloading}
                    variant="primary"
                    className="w-full flex items-center justify-center gap-2"
                  >
                    <Download className="w-5 h-5" />
                    {isDownloading ? 'กำลังดาวน์โหลด...' : 'บันทึกเป็นรูปภาพ'}
                  </Button>
                  <Button
                    onClick={onClose}
                    variant="outline"
                    className="w-full"
                  >
                    ปิด
                  </Button>
                </div>

                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    💡 <strong>วิธีใช้งาน:</strong> ส่ง QR Code นี้ให้ผู้ป่วยเพื่อให้ผู้ป่วยสามารถเข้าดูข้อมูลของตัวเองได้
                  </p>
                </div>
              </div>
            </motion.div>
          </>
        )}
    </AnimatePresence>
  );
}
