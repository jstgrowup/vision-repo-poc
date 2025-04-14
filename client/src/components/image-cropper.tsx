import React from "react";
import Cropper from "react-easy-crop";
import { Area, Point } from "react-easy-crop";
export interface ImageCropperProps {
  imageSrc: string | null;
  showCropper: boolean;
  crop: Point;
  zoom: number;
  aspectRatio?: number;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onCropChange: (location: Point) => void;
  onZoomChange: (zoom: number) => void;
  onToggleCropper: () => void;
  onCropComplete: (croppedAreaPixels: Area) => void;
}
const ImageCropper: React.FC<ImageCropperProps> = ({
  imageSrc,
  showCropper,
  crop,
  zoom,
  aspectRatio = 4 / 3,
  onFileChange,
  onCropChange,
  onZoomChange,
  onToggleCropper,
  onCropComplete,
}) => {
  return (
    <div className="w-full h-screen flex flex-col items-center justify-start p-6 overflow-auto bg-gray-100">
      <input type="file" accept="image/*" onChange={onFileChange} />

      {imageSrc && !showCropper && (
        <>
          <img
            src={imageSrc}
            alt="Preview"
            className="mt-4 max-w-[300px] max-h-[500px] border rounded"
          />
          <button
            onClick={onToggleCropper}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
          >
            Crop Image
          </button>
        </>
      )}

      {imageSrc && showCropper && (
        <div
          className="relative mt-6  rounded"
          style={{ width: 400, height: 300 }}
        >
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspectRatio}
            onCropChange={onCropChange}
            onZoomChange={onZoomChange}
            onCropComplete={(_, croppedAreaPixels) =>
              onCropComplete(croppedAreaPixels)
            }
          />
        </div>
      )}
    </div>
  );
};

export default ImageCropper;
