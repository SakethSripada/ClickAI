/*****************************************************
 * src/SnippingTool.js
 * 
 * This React component renders an overlay that allows
 * the user to snip a portion of the screen. Once a snip
 * is completed, the cropped image data (as a base64 URL)
 * is passed to the provided onComplete callback.
 *****************************************************/
import React, { useState, useEffect, useRef } from 'react';
import './SnippingTool.css';

const SnippingTool = ({ onComplete, onCancel }) => {
  const [screenshot, setScreenshot] = useState(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selection, setSelection] = useState(null); // { startX, startY, endX, endY }
  const overlayRef = useRef(null);

  useEffect(() => {
    // Request screenshot from background script
    chrome.runtime.sendMessage({ type: 'captureScreenshot' }, (response) => {
      if (response && response.screenshot) {
        setScreenshot(response.screenshot);
      }
    });
  }, []);

  const handleMouseDown = (e) => {
    if (!screenshot) return;
    const rect = overlayRef.current.getBoundingClientRect();
    const startX = e.clientX - rect.left;
    const startY = e.clientY - rect.top;
    setSelection({ startX, startY, endX: startX, endY: startY });
    setIsSelecting(true);
  };

  const handleMouseMove = (e) => {
    if (!isSelecting || !selection) return;
    const rect = overlayRef.current.getBoundingClientRect();
    const endX = e.clientX - rect.left;
    const endY = e.clientY - rect.top;
    setSelection({ ...selection, endX, endY });
  };

  const handleMouseUp = () => {
    if (isSelecting) {
      setIsSelecting(false);
    }
  };

  const handleSend = () => {
    if (!selection || !screenshot) return;
    const { startX, startY, endX, endY } = selection;
    const x = Math.min(startX, endX);
    const y = Math.min(startY, endY);
    const width = Math.abs(endX - startX);
    const height = Math.abs(endY - startY);
    const image = new Image();
    image.onload = () => {
      const scaleX = image.width / overlayRef.current.offsetWidth;
      const scaleY = image.height / overlayRef.current.offsetHeight;
      const canvas = document.createElement('canvas');
      canvas.width = width * scaleX;
      canvas.height = height * scaleY;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(
        image,
        x * scaleX,
        y * scaleY,
        width * scaleX,
        height * scaleY,
        0,
        0,
        width * scaleX,
        height * scaleY
      );
      const croppedImage = canvas.toDataURL('image/png');
      onComplete(croppedImage);
    };
    image.src = screenshot;
  };

  return (
    <div
      className="snipping-overlay"
      style={{ backgroundImage: screenshot ? `url(${screenshot})` : 'none' }}
    >
      {!screenshot && <div className="loading">Loading screenshot...</div>}
      <div
        className="snipping-selection-overlay"
        ref={overlayRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        {selection && (
          <div
            className="selection-rectangle"
            style={{
              left: Math.min(selection.startX, selection.endX),
              top: Math.min(selection.startY, selection.endY),
              width: Math.abs(selection.endX - selection.startX),
              height: Math.abs(selection.endY - selection.startY),
            }}
          ></div>
        )}
      </div>
      {selection && !isSelecting && (
        <div className="snipping-controls">
          <button onClick={handleSend} className="snip-send-btn">Send to AI</button>
          <button onClick={onCancel} className="snip-cancel-btn">Cancel</button>
        </div>
      )}
    </div>
  );
};

export default SnippingTool;
