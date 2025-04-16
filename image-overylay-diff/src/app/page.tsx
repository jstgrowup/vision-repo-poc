"use client";

import React, { useState, useRef, useEffect } from "react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { highlightImageDifferences } from "@/ai/flows/highlight-image-differences";
import { Toaster } from "@/components/ui/toaster";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const PlaceholderImage = "https://picsum.photos/500/300";

function ImageDisplay({ src, alt }: { src: string; alt: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Original Image</CardTitle>
        <CardDescription>{alt}</CardDescription>
      </CardHeader>
      <CardContent>
        <img src={src} alt={alt} className="rounded-md" />
      </CardContent>
    </Card>
  );
}

function ImageOverlay({
  topImage,
  bottomImage,
  opacity,
}: {
  topImage: string;
  bottomImage: string;
  opacity: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
        setContainerHeight(containerRef.current.offsetHeight);
      }
    };

    updateSize();
    window.addEventListener("resize", updateSize);

    return () => {
      window.removeEventListener("resize", updateSize);
    };
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Image Overlay</CardTitle>
        <CardDescription>Visually compare the images</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative border border-black" ref={containerRef}>
          <img
            src={bottomImage}
            alt="Bottom Layer"
            className="rounded-md w-full h-auto"
          />
          <img
            src={topImage}
            alt="Top Layer"
            style={{
              opacity,
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              mixBlendMode: "normal",
            }}
            className="rounded-md"
          />
        </div>
      </CardContent>
    </Card>
  );
}

function HighlightedImage({
  highlightedImageUrl,
  differencesFound,
  description,
}: {
  highlightedImageUrl: string;
  differencesFound: boolean;
  description: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Highlighted Differences</CardTitle>
        <CardDescription>Powered by GenAI</CardDescription>
      </CardHeader>
      <CardContent>
        {differencesFound ? (
          <>
            <img
              src={highlightedImageUrl}
              alt="Highlighted Differences"
              className="rounded-md"
            />
            <p className="mt-2 text-sm">{description}</p>
          </>
        ) : (
          <p>No differences found.</p>
        )}
      </CardContent>
    </Card>
  );
}

export default function Home() {
  const [opacity, setOpacity] = useState(0.5);
  const [imageAUrl, setImageAUrl] = useState(PlaceholderImage);
  const [imageBUrl, setImageBUrl] = useState(PlaceholderImage);
  const [highlightedImage, setHighlightedImage] = useState<{
    highlightedImageUrl: string;
    differencesFound: boolean;
    description: string;
  } | null>(null);
  const { toast } = useToast();

  const handleHighlightDifferences = async () => {
    try {
      const result = await highlightImageDifferences({ imageAUrl, imageBUrl });
      setHighlightedImage(result);
    } catch (error: any) {
      console.error("Error highlighting differences:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to highlight differences.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-background p-4 md:p-8">
      <h1 className="text-2xl md:text-3xl font-bold mb-4 text-foreground">
        Diffy Visual
      </h1>
      <div className="flex flex-col md:flex-row gap-4 w-full max-w-5xl">
        <div className="w-full md:w-1/3">
          <Card>
            <CardHeader>
              <CardTitle>Image URLs</CardTitle>
              <CardDescription>
                Enter the URLs of the images to compare
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col space-y-4">
              <div>
                <Label htmlFor="imageAUrl">Image A URL</Label>
                <Input
                  type="url"
                  id="imageAUrl"
                  value={imageAUrl}
                  onChange={(e) => setImageAUrl(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="imageBUrl">Image B URL</Label>
                <Input
                  type="url"
                  id="imageBUrl"
                  value={imageBUrl}
                  onChange={(e) => setImageBUrl(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="w-full md:w-2/3 flex flex-col gap-4">
          <ImageOverlay
            topImage={imageAUrl}
            bottomImage={imageBUrl}
            opacity={opacity}
          />
          <Card>
            <CardHeader>
              <CardTitle>Opacity Control</CardTitle>
              <CardDescription>
                Adjust the opacity of the top image
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Label htmlFor="opacitySlider">Opacity:</Label>
                <Slider
                  id="opacitySlider"
                  defaultValue={[opacity * 100]}
                  max={100}
                  step={1}
                  onValueChange={(value) => setOpacity(value[0] / 100)}
                  className="w-full"
                />
              </div>
            </CardContent>
          </Card>
          <Button
            onClick={handleHighlightDifferences}
            className="bg-primary text-primary-foreground hover:bg-primary/80"
          >
            Highlight Differences
          </Button>
        </div>
      </div>
      <div className="flex flex-col md:flex-row gap-4 w-full max-w-5xl mt-4">
        <div className="w-full md:w-1/3">
          <ImageDisplay src={imageAUrl} alt="Image A" />
        </div>
        <div className="w-full md:w-1/3">
          <ImageDisplay src={imageBUrl} alt="Image B" />
        </div>
        {highlightedImage && (
          <div className="w-full md:w-1/3">
            <HighlightedImage
              highlightedImageUrl={highlightedImage.highlightedImageUrl}
              differencesFound={highlightedImage.differencesFound}
              description={highlightedImage.description}
            />
          </div>
        )}
      </div>
      <Toaster />
    </div>
  );
}
