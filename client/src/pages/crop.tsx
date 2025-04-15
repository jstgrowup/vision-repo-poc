import { useState, useEffect } from "react";
import ReactCrop, {
  Crop,
  PixelCrop,
  centerCrop,
  makeAspectCrop,
} from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

const getImageDimensions = (
  src: string
): Promise<{ width: number; height: number }> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = src;
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
  });
};

function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number
) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: "%",
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight
    ),
    mediaWidth,
    mediaHeight
  );
}
const CropComponent = () => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);

  const [imageSrc2, setImageSrc2] = useState<string | null>(null);
  const [showCropper2, setShowCropper2] = useState(false);
  const [crop2, setCrop2] = useState<Crop>();
  const [completedCrop2, setCompletedCrop2] = useState<PixelCrop | null>(null);

  const [dimensions1, setDimensions1] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [dimensions2, setDimensions2] = useState<{
    width: number;
    height: number;
  } | null>(null);

  const [imgRef, setImgRef] = useState<HTMLImageElement | null>(null);
  const [imgRef2, setImgRef2] = useState<HTMLImageElement | null>(null);

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth: width, naturalHeight: height } = e.currentTarget;
    setCrop(centerAspectCrop(width, height, 4 / 3));
  };

  const onImageLoad2 = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth: width, naturalHeight: height } = e.currentTarget;
    setCrop2(centerAspectCrop(width, height, 4 / 3));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type === "application/pdf") {
      const formData = new FormData();
      formData.append("pdfs", file);

      try {
        const res = await fetch("http://localhost:8000/upload-pdfs", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) throw new Error("Failed to upload PDF");

        console.log("res:", res);
        const { image: imageUrl } = await res.json();
        setImageSrc(imageUrl);

        const dim = await getImageDimensions(imageUrl);
        setDimensions1(dim);
      } catch (err) {
        console.error("Error converting PDF to image:", err);
      }
    } else {
      // fallback to image
      const reader = new FileReader();
      reader.onload = async () => {
        const src = reader.result as string;
        setImageSrc(src);
        const dim = await getImageDimensions(src);
        setDimensions1(dim);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileChange2 = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type === "application/pdf") {
      const formData = new FormData();
      formData.append("pdfs", file);

      try {
        const res = await fetch("http://localhost:8000/upload-pdfs", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) throw new Error("Failed to upload PDF");

        const { image: imageUrl } = await res.json();
        setImageSrc2(imageUrl);

        const dim = await getImageDimensions(imageUrl);
        setDimensions2(dim);
      } catch (err) {
        console.error("Error converting PDF to image:", err);
      }
    } else {
      const reader = new FileReader();
      reader.onload = async () => {
        const src = reader.result as string;
        setImageSrc2(src);
        const dim = await getImageDimensions(src);
        setDimensions2(dim);
      };
      reader.readAsDataURL(file);
    }
  };

  const getCroppedImg = async (
    src: string,
    pixels: PixelCrop,
    originalDimensions?: { width: number; height: number }
  ) => {
    if (!src || !pixels) return null;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = src;
    await new Promise((res, rej) => {
      img.onload = res;
      img.onerror = rej;
    });

    let cropArea = pixels;
    if (originalDimensions) {
      const scaleX = img.naturalWidth / originalDimensions.width;
      const scaleY = img.naturalHeight / originalDimensions.height;

      cropArea = {
        x: pixels.x * scaleX,
        y: pixels.y * scaleY,
        width: pixels.width * scaleX,
        height: pixels.height * scaleY,
        unit: "px",
      };
    }

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    canvas.width = cropArea.width;
    canvas.height = cropArea.height;

    ctx.drawImage(
      img,
      cropArea.x,
      cropArea.y,
      cropArea.width,
      cropArea.height,
      0,
      0,
      cropArea.width,
      cropArea.height
    );

    return canvas.toDataURL("image/jpeg");
  };

  const handleCropSubmit = async () => {
    if (!imageSrc || !completedCrop || !dimensions1) return;

    const croppedImage = await getCroppedImg(imageSrc, completedCrop);
    if (croppedImage) {
      setImageSrc(croppedImage);
      setShowCropper(false);

      // If second image exists, auto-crop it with scaled dimensions
      if (imageSrc2 && dimensions2) {
        const secondCropped = await getCroppedImg(
          imageSrc2,
          completedCrop,
          dimensions1
        );
        if (secondCropped) {
          setImageSrc2(secondCropped);
        }
      }
    }
  };

  const handleCropSubmit2 = async () => {
    if (!imageSrc2 || !completedCrop2) return;

    const croppedImage = await getCroppedImg(imageSrc2, completedCrop2);
    if (croppedImage) {
      setImageSrc2(croppedImage);
      setShowCropper2(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" && showCropper) {
        handleCropSubmit();
      }
      if (e.key === "Enter" && showCropper2) {
        handleCropSubmit2();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    showCropper,
    showCropper2,
    completedCrop,
    completedCrop2,
    imageSrc,
    imageSrc2,
    dimensions1,
    dimensions2,
  ]);
  return (
    <div className="flex">
      <div className="w-full h-screen flex flex-col items-center justify-start p-6 overflow-auto bg-gray-100">
        <input type="file" accept="image/*,.pdf" onChange={handleFileChange} />
        {imageSrc && !showCropper && (
          <>
            <img
              src={imageSrc}
              alt="Preview"
              className="mt-4 max-w-[300px] max-h-[500px] border rounded"
              ref={setImgRef}
            />
            <button
              onClick={() => setShowCropper(true)}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
            >
              Crop Image
            </button>
          </>
        )}
        {imageSrc && showCropper && (
          <>
            <div className="mt-6 border rounded" style={{ width: 400 }}>
              <ReactCrop
                crop={crop}
                onChange={(c) => setCrop(c)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={4 / 3}
              >
                <img
                  src={imageSrc}
                  alt="Crop me"
                  onLoad={onImageLoad}
                  style={{ maxHeight: 300 }}
                />
              </ReactCrop>
            </div>
            <button
              onClick={handleCropSubmit}
              className="mt-4 px-4 py-2 bg-green-600 text-white rounded"
            >
              Apply Crop
            </button>
          </>
        )}
      </div>

      <div className="w-full h-screen flex flex-col items-center justify-start p-6 overflow-auto bg-gray-100">
        <input type="file" accept="image/*,.pdf" onChange={handleFileChange2} />

        {imageSrc2 && !showCropper2 && (
          <>
            <img
              src={imageSrc2}
              alt="Preview"
              className="mt-4 max-w-[300px] max-h-[500px] border rounded"
              ref={setImgRef2}
            />
            <button
              onClick={() => setShowCropper2(true)}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
            >
              Crop Image
            </button>
          </>
        )}
        {imageSrc2 && showCropper2 && (
          <>
            <div className="mt-6 border rounded" style={{ width: 400 }}>
              <ReactCrop
                crop={crop2}
                onChange={(c) => setCrop2(c)}
                onComplete={(c) => setCompletedCrop2(c)}
                aspect={4 / 3}
              >
                <img
                  src={imageSrc2}
                  alt="Crop me"
                  onLoad={onImageLoad2}
                  style={{ maxHeight: 300 }}
                />
              </ReactCrop>
            </div>
            <button
              onClick={handleCropSubmit2}
              className="mt-4 px-4 py-2 bg-green-600 text-white rounded"
            >
              Apply Crop
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default CropComponent;
