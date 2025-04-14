import React, { useState, useCallback, useEffect } from "react";
import Cropper from "react-easy-crop";
import { Area } from "react-easy-crop";

type ImageCropState = {
  imageSrc: string | null;
  croppedImage: string | null;
  crop: { x: number; y: number };
  zoom: number;
  croppedAreaPixels: Area | null;
  showCropper: boolean;
};

export default function useImageCropper() {
  const [state, setState] = useState<ImageCropState>({
    imageSrc: null,
    croppedImage: null,
    crop: { x: 0, y: 0 },
    zoom: 1,
    croppedAreaPixels: null,
    showCropper: false,
  });

  const onCropChange = (crop: { x: number; y: number }) =>
    setState((s) => ({ ...s, crop }));
  const onZoomChange = (zoom: number) => setState((s) => ({ ...s, zoom }));
  const onCropComplete = useCallback((_: Area, croppedAreaPixels: Area) => {
    setState((s) => ({ ...s, croppedAreaPixels }));
  }, []);

  const onImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () =>
      setState((s) => ({
        ...s,
        imageSrc: reader.result as string,
        showCropper: true,
      }));
  };

  const getCroppedImg = async (): Promise<string | null> => {
    const image = new Image();
    if (!state.imageSrc || !state.croppedAreaPixels) return null;
    return new Promise((resolve) => {
      image.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const { width, height, x, y } = state.croppedAreaPixels!;
        canvas.width = width;
        canvas.height = height;

        ctx.drawImage(image, x, y, width, height, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg"));
      };
      //   @ts-ignore
      image.src = state.imageSrc;
    });
  };

  const cropImage = async () => {
    const cropped = await getCroppedImg();
    if (cropped) {
      setState((s) => ({
        ...s,
        croppedImage: cropped,
        imageSrc: cropped,
        showCropper: false,
      }));
    }
  };

  return {
    state,
    onCropChange,
    onZoomChange,
    onCropComplete,
    onImageChange,
    cropImage,
  };
}
