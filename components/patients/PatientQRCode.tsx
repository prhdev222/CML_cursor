'use client';

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Download, QrCode, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import html2canvas from 'html2canvas';
import Button from '@/components/ui/Button';

interface PatientQRCodeProps {
  patientId: string;
  patientName: string;
}

export default function PatientQRCode({ patientId, patientName }: PatientQRCodeProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const patientUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/patient/${patientId}`
    : `https://yourdomain.com/patient/${patientId}`;

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const qrElement = document.getElementById('qr-code-container');
      if (!qrElement) return;

      const canvas = await html2canvas(qrElement, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
      });

      const link = document.createElement('a');
      link.download = `QR-Code-${patientId}-${patientName}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Error downloading QR code:', error);
      alert('เกิดข้อผิดพลาดในการดาวน์โหลด');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        size="sm"
        className="flex items-center gap-2"
      >
        <QrCode className="w-4 h-4" />
        ดู QR Code
      </Button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
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
                    onClick={() => setIsOpen(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div id="qr-code-container" className="bg-white p-6 rounded-xl border-2 border-gray-200 mb-6">
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
                    <p className="text-xs text-gray-500 break-all">{patientUrl}</p>
                  </div>
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
                    onClick={() => setIsOpen(false)}
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
    </>
  );
}



